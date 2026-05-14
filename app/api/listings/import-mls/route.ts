import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Increase function timeout for MLS import (Vercel Pro: 60s, Hobby: 10s)
export const maxDuration = 60; // seconds
export const dynamic = 'force-dynamic'; // Disable caching for this route
// HasData API integration with job polling

// Helper function to download image and upload to Supabase
async function downloadAndUploadImage(imageUrl: string, mlsId: string, index: number, supabase: any): Promise<string | null> {
    try {
        console.log(`[MLS Import] Downloading image ${index + 1}: ${imageUrl}`);

        // Download image with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(imageUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.error(`[MLS Import] Failed to download image ${index + 1} (${response.status}): ${imageUrl}`);
            return null;
        }

        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';

        console.log(`[MLS Import] Downloaded image ${index + 1} (${blob.size} bytes, ${contentType})`);

        // Create unique filename
        const fileName = `${mlsId}-${Date.now()}-${index}.${extension}`;
        const filePath = `listings/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
            .from('listing-photos')
            .upload(filePath, blob, {
                contentType,
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error(`[MLS Import] Error uploading image ${index + 1}:`, uploadError);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('listing-photos')
            .getPublicUrl(filePath);

        console.log(`[MLS Import] Successfully uploaded image ${index + 1}: ${publicUrl}`);
        return publicUrl;
    } catch (error: any) {
        console.error(`[MLS Import] Error processing image ${index + 1}:`, error.message);
        return null;
    }
}

// Helper function to poll job status
async function pollJobStatus(jobId: string, apiKey: string, maxAttempts = 30): Promise<any> {
    // Wait 1 second before first poll to let job become available
    await new Promise(resolve => setTimeout(resolve, 1000));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Poll using the scrapers jobs endpoint (without scraper name)
        const pollUrl = `https://api.hasdata.com/scrapers/jobs/${jobId}`;
        console.log(`[MLS Import] Polling attempt ${attempt + 1}: ${pollUrl}`);

        const response = await fetch(pollUrl, {
            headers: {
                'x-api-key': apiKey
            }
        });

        console.log(`[MLS Import] Poll response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[MLS Import] Poll failed (${response.status}):`, errorText);

            // Only fail after multiple attempts
            if (attempt >= 3) {
                let userMessage = 'Failed to retrieve listing data from MLS service.';

                if (response.status === 404) {
                    userMessage = 'The MLS listing could not be found. Please verify the MLS ID and location are correct.';
                } else if (response.status === 401 || response.status === 403) {
                    userMessage = 'Authentication error with the listing service. Please contact support.';
                } else if (response.status >= 500) {
                    userMessage = 'The listing service is currently experiencing issues. Please try again in a few minutes.';
                }

                throw new Error(userMessage);
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
        }

        const jobData = await response.json();
        console.log(`[MLS Import] Job status (attempt ${attempt + 1}):`, jobData.status);
        console.log(`[MLS Import] Full job data:`, JSON.stringify(jobData, null, 2));

        if (jobData.status === 'finished') {
            console.log('[MLS Import] Job finished! Result structure:', Object.keys(jobData));
            console.log('[MLS Import] Result data:', JSON.stringify(jobData.result || jobData.data || jobData, null, 2));
            // Return the entire job data object
            return jobData;
        } else if (jobData.status === 'failed') {
            throw new Error(jobData.error || 'Job failed');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('The import is taking longer than expected. This may be due to high demand on the listing service. Please try again in a few minutes.');
}

export async function POST(request: Request) {
    try {
        const { mlsId, location } = await request.json();
        const supabase = await createClient();

        if (!mlsId) {
            return NextResponse.json({
                error: 'MLS ID is required',
                userFriendly: true
            }, { status: 400 });
        }

        if (!location) {
            return NextResponse.json({
                error: 'Location is required (e.g., "Los Angeles, CA")',
                userFriendly: true
            }, { status: 400 });
        }

        const apiKey = process.env.HASDATA_API_KEY;
        if (!apiKey) {
            console.error('HASDATA_API_KEY not configured');
            return NextResponse.json({
                error: 'Server configuration error. Please contact support.',
                userFriendly: true
            }, { status: 500 });
        }

        console.log(`[MLS Import] Starting import for MLS ID: ${mlsId}, Location: ${location}`);

        // Step 1: Create job with HasData Zillow Scraper API
        let jobResponse;
        try {
            jobResponse = await fetch('https://api.hasdata.com/scrapers/zillow/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    type: 'forSale',
                    keyword: location, // Location (REQUIRED)
                    keywords: mlsId, // MLS number goes in keywords (plural)
                    detailedInformation: true
                }),
                signal: AbortSignal.timeout(10000) // 10 seconds for job creation
            });
        } catch (error: any) {
            console.error('[MLS Import] HasData API connection error:', error);

            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                return NextResponse.json({
                    error: 'Request timed out while connecting to listing service. Please try again.',
                    userFriendly: true
                }, { status: 504 });
            }

            return NextResponse.json({
                error: `Failed to connect to listing service: ${error.message}`,
                userFriendly: true
            }, { status: 503 });
        }

        console.log(`[MLS Import] Job creation response status: ${jobResponse.status}`);
        console.log(`[MLS Import] Response headers:`, Object.fromEntries(jobResponse.headers.entries()));

        // Get the raw response text first
        const rawResponse = await jobResponse.text();
        console.log(`[MLS Import] Raw response (first 500 chars):`, rawResponse.substring(0, 500));

        if (!jobResponse.ok) {
            console.error('[MLS Import] HasData API Error:', {
                status: jobResponse.status,
                statusText: jobResponse.statusText,
                body: rawResponse
            });

            return NextResponse.json({
                error: `Listing service error (${jobResponse.status}). The MLS ID or location may be invalid.`,
                details: rawResponse.substring(0, 200),
                userFriendly: true
            }, { status: 502 });
        }

        let jobData;
        try {
            jobData = JSON.parse(rawResponse);
            console.log('[MLS Import] Parsed job response:', JSON.stringify(jobData, null, 2));
            console.log('[MLS Import] Response keys:', Object.keys(jobData));
        } catch (error: any) {
            console.error('[MLS Import] Failed to parse job creation response:', error);
            console.error('[MLS Import] Raw response was:', rawResponse);
            return NextResponse.json({
                error: 'Invalid response from listing service. Please try again.',
                userFriendly: true
            }, { status: 502 });
        }

        // Extract job ID - try different possible field names
        const jobId = jobData.jobId || jobData.id || jobData.job_id || jobData.data?.jobId;

        if (!jobId) {
            console.error('[MLS Import] No job ID found in response:', jobData);
            return NextResponse.json({
                error: 'No job ID returned from listing service. Response: ' + JSON.stringify(jobData).substring(0, 200),
                userFriendly: true
            }, { status: 502 });
        }

        console.log('[MLS Import] Job created:', { jobId });

        // Step 2: Poll for job completion
        let result;
        try {
            result = await pollJobStatus(jobId, apiKey);
        } catch (error: any) {
            console.error('[MLS Import] Job polling error:', error);
            return NextResponse.json({
                error: `Job failed: ${error.message}`,
                userFriendly: true
            }, { status: 500 });
        }

        // Log the full result structure
        console.log('[MLS Import] Received result:', JSON.stringify(result, null, 2));
        console.log('[MLS Import] Result keys:', Object.keys(result || {}));
        if (result?.data) {
            console.log('[MLS Import] Data keys:', Object.keys(result.data));
            console.log('[MLS Import] Data object:', JSON.stringify(result.data, null, 2));
        }
        console.log('[MLS Import] Data rows count:', result?.data?.dataRowsCount || result?.dataRowsCount || 'unknown');

        // Check for data in alternative locations
        if (result?.output) console.log('[MLS Import] Has output field:', Object.keys(result.output));
        if (result?.result) console.log('[MLS Import] Has result field (type):', typeof result.result);
        if (result?.scrapeResult) console.log('[MLS Import] Has scrapeResult field:', Object.keys(result.scrapeResult));

        // Fetch the actual data from the JSON URL
        let listingData = null;

        // Check all possible data locations in priority order
        if (result?.result && Array.isArray(result.result) && result.result.length > 0) {
            console.log('[MLS Import] Found inline result data');
            listingData = result.result[0];
        } else if (result?.results && Array.isArray(result.results) && result.results.length > 0) {
            console.log('[MLS Import] Found results array');
            listingData = result.results[0];
        } else if (result?.data?.results && Array.isArray(result.data.results) && result.data.results.length > 0) {
            console.log('[MLS Import] Found data.results');
            listingData = result.data.results[0];
        } else if (result?.data?.rows && Array.isArray(result.data.rows) && result.data.rows.length > 0) {
            console.log('[MLS Import] Found data.rows');
            listingData = result.data.rows[0];
        } else if (result?.rows && Array.isArray(result.rows) && result.rows.length > 0) {
            console.log('[MLS Import] Found rows');
            listingData = result.rows[0];
        } else if (result?.data?.json) {
            console.log('[MLS Import] Fetching data from JSON URL:', result.data.json);
            const dataRowsCount = result.data.dataRowsCount || result.dataRowsCount || '0';
            console.log('[MLS Import] Data rows count indicates:', dataRowsCount, 'rows');

            // Check if dataRowsCount is 0 before fetching
            if (dataRowsCount === '0' || dataRowsCount === 0) {
                console.error('[MLS Import] Data rows count is 0, no listings found');
                console.error('[MLS Import] Search parameters - MLS ID:', mlsId, 'Location:', location);
                return NextResponse.json({
                    error: 'No listing found matching this MLS ID and location combination.',
                    details: 'Zillow may not have this MLS number indexed. Try searching by street address instead, or verify the MLS ID is listed on Zillow.com.',
                    userFriendly: true
                }, { status: 404 });
            }

            const dataResponse = await fetch(result.data.json, {
                headers: {
                    'x-api-key': apiKey
                }
            });
            if (!dataResponse.ok) {
                console.error('[MLS Import] Failed to fetch data file:', {
                    status: dataResponse.status,
                    statusText: dataResponse.statusText
                });
                return NextResponse.json({
                    error: 'Failed to retrieve listing data. The MLS listing may not exist or is not available.',
                    userFriendly: true
                }, { status: 404 });
            }

            let jsonData;
            try {
                const rawText = await dataResponse.text();
                console.log('[MLS Import] Raw JSON response (first 200 chars):', rawText.substring(0, 200));

                // Check for malformed JSON (just "]" or empty)
                if (!rawText || rawText.trim() === ']' || rawText.trim() === '') {
                    console.error('[MLS Import] Empty or malformed JSON response');
                    console.error('[MLS Import] Search parameters - MLS ID:', mlsId, 'Location:', location);
                    return NextResponse.json({
                        error: 'No listing found matching this MLS ID and location combination.',
                        details: 'Zillow may not have this MLS number indexed. Try searching by street address instead, or verify the MLS ID is listed on Zillow.com.',
                        userFriendly: true
                    }, { status: 404 });
                }

                jsonData = JSON.parse(rawText);
                console.log('[MLS Import] Fetched JSON data:', JSON.stringify(jsonData, null, 2));
            } catch (parseError: any) {
                console.error('[MLS Import] Failed to parse JSON data:', parseError.message);
                return NextResponse.json({
                    error: 'No listing found for this MLS ID and location. Please verify the MLS ID is correct and the property is listed in the specified area.',
                    details: 'The listing service returned no results for this search.',
                    userFriendly: true
                }, { status: 404 });
            }

            // Check if we got an empty array or no results
            if (Array.isArray(jsonData) && jsonData.length === 0) {
                console.error('[MLS Import] Empty results array from listing service');
                console.error('[MLS Import] Search parameters - MLS ID:', mlsId, 'Location:', location);
                return NextResponse.json({
                    error: 'No listing found matching this MLS ID and location combination.',
                    details: 'Zillow may not have this MLS number indexed. Try searching by street address instead, or verify the MLS ID is listed on Zillow.com.',
                    userFriendly: true
                }, { status: 404 });
            }

            // The JSON file should contain an array of listings
            listingData = Array.isArray(jsonData) ? jsonData[0] : jsonData;
        } else {
            console.error('[MLS Import] No data found in any expected location');
            console.error('[MLS Import] Checked: result.result, result.data.rows, result.rows, result.data.json');
            console.error('[MLS Import] Available keys:', Object.keys(result || {}));
            return NextResponse.json({
                error: 'No listing data available from the scraping service.',
                details: 'The job completed but no data was found. MLS ID may not be indexed on Zillow.',
                userFriendly: true
            }, { status: 404 });
        }

        console.log('[MLS Import] Extracted listing data:', JSON.stringify(listingData, null, 2));

        // Validate we got expected data
        if (!listingData || (!listingData.price && !listingData.address)) {
            console.error('[MLS Import] Invalid listing data structure:', {
                listingData,
                fullResult: result
            });
            return NextResponse.json({
                error: 'The listing data is incomplete or invalid. Please verify the MLS ID and location are correct.',
                details: 'The listing service returned data but it is missing required fields (price or address).',
                userFriendly: true
            }, { status: 404 });
        }

        console.log('[MLS Import] Valid listing data received, processing...');

        // Map property type
        const mapPropertyType = (type: string) => {
            const map: Record<string, string> = {
                'SINGLE_FAMILY': 'single_family_home',
                'CONDO': 'condo',
                'APARTMENT': 'apartment',
                'TOWNHOUSE': 'single_family_home',
            };
            return map[type] || 'single_family_home';
        };

        // Find or create agent
        let agentId;

        // Get current user first
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({
                error: 'Unable to assign an agent to this listing. Please make sure you are logged in and try again.',
                userFriendly: true
            }, { status: 401 });
        }

        // Check if current user is admin
        const { data: currentUserProfile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        // Log profile query results for debugging
        console.log('[MLS Import] User Profile Query:', {
            userId: user.id,
            profileData: currentUserProfile,
            profileError: profileError,
            roleValue: currentUserProfile?.role,
            roleType: typeof currentUserProfile?.role
        });

        const isAdmin = currentUserProfile?.role === 'admin' ||
                        currentUserProfile?.role === 'admin';

        // 1. Try to find agent by name (only if current user is admin)
        if (isAdmin && listingData.agentName) {
            const { data: agent } = await supabase
                .from('users')
                .select('id')
                .ilike('full_name', listingData.agentName)
                .maybeSingle();

            if (agent) {
                agentId = agent.id;
                console.log(`[MLS Import] Admin user assigning listing to agent: ${listingData.agentName} (${agent.id})`);
            }
        }

        // 2. If not admin or agent not found, use current user
        if (!agentId) {
            agentId = user.id;
            if (!isAdmin && listingData.agentName) {
                console.log(`[MLS Import] Non-admin user, assigning to self despite MLS agent name: ${listingData.agentName}`);
            }
        }

        // Download Zillow images and upload to our storage
        const zillowImages = listingData.photos
            ? (Array.isArray(listingData.photos) ? listingData.photos : listingData.photos.split(',').map((url: string) => url.trim()))
            : (listingData.image ? [listingData.image] : []);

        console.log(`[MLS Import] Found ${zillowImages.length} images to download from listing`);
        console.log(`[MLS Import] Image URLs:`, zillowImages);

        // Download and upload all images in parallel
        const uploadPromises = zillowImages.map((url: string, index: number) =>
            downloadAndUploadImage(url, mlsId, index, supabase)
        );
        const uploadedImages = await Promise.all(uploadPromises);

        // Filter out any failed uploads (null values)
        const images = uploadedImages.filter(url => url !== null) as string[];

        console.log(`[MLS Import] Successfully uploaded ${images.length}/${zillowImages.length} images`);
        if (images.length < zillowImages.length) {
            console.warn(`[MLS Import] Failed to upload ${zillowImages.length - images.length} images`);
        }

        // Prepare features/extra data
        const features = {
            year_built: listingData.yearBuilt,
            lot_area: listingData.lotArea,
            lot_area_units: listingData.lotAreaUnits,
            schools: listingData.schools,
            days_on_zillow: listingData.daysOnZillow,
            agent_phone: listingData.agentPhoneNumber,
            agent_email: listingData.agentEmail,
        };

        // Log diagnostic information for RLS troubleshooting
        console.log('[MLS Import] RLS Diagnostic Info:', {
            currentUserId: user.id,
            currentUserRole: currentUserProfile?.role,
            isAdmin,
            assignedAgentId: agentId,
            agentIdMatchesUser: agentId === user.id,
            mlsAgentName: listingData.agentName,
            bypassAuth: process.env.BYPASS_AUTH === 'true'
        });

        // Use service role client for admin users assigning to other agents
        // This bypasses RLS since we've already verified admin permissions above
        // For agents importing their own listings, use regular client
        const needsServiceRole = isAdmin && agentId !== user.id;
        const insertClient = needsServiceRole ? await createServiceRoleClient() : supabase;

        console.log('[MLS Import] Using', needsServiceRole ? 'service role client (admin importing for another agent)' : 'authenticated client (agent importing own listing)');

        // Insert listing as draft for agent to review and edit
        const { data: newListing, error } = await insertClient
            .from('listings')
            .insert({
                agent_id: agentId,
                property_address: listingData.fullAddress || listingData.address?.streetAddress, // Handle potential structure diffs
                property_city: listingData.city || listingData.address?.city,
                property_state: listingData.state || listingData.address?.state,
                property_zip: listingData.zipcode || listingData.address?.zipcode,
                price: listingData.price,
                property_type: mapPropertyType(listingData.homeType),
                listing_type: 'for_sale',
                bedrooms: listingData.beds || listingData.bedrooms,
                bathrooms: listingData.baths || listingData.bathrooms,
                description: listingData.description,
                images: images,
                cover_image: images[0] || null, // Use downloaded image, not Zillow URL
                status: 'pending', // Set as pending so agent can review before publishing
                features: features,
                mls_number: mlsId,
            })
            .select()
            .single();

        if (error) {
            console.error('[MLS Import] Error inserting listing:', error);
            console.error('[MLS Import] Full error details:', JSON.stringify(error, null, 2));

            // Handle duplicate MLS number - this is expected behavior
            if (error.code === '23505' && error.message?.includes('listings_mls_number_key')) {
                console.log(`[MLS Import] MLS #${mlsId} already exists in database - skipping duplicate`);
                return NextResponse.json({
                    success: false,
                    error: `Listing MLS #${mlsId} already exists in the database`,
                    isDuplicate: true,
                    userFriendly: true
                }, { status: 409 }); // 409 Conflict
            }

            // If it's an RLS policy error, provide more context
            if (error.message?.includes('row-level security policy')) {
                console.error('[MLS Import] RLS Policy Violation Details:', {
                    message: 'The database rejected the INSERT due to RLS policy',
                    userRole: currentUserProfile?.role,
                    userId: user.id,
                    agentId: agentId,
                    expectedRoles: ['admin'],
                    agentMatchesUser: agentId === user.id,
                    troubleshooting: 'Check: 1) User role in database matches expected values, 2) auth.uid() returns correct user ID, 3) RLS policy is active and correct'
                });

                return NextResponse.json({
                    error: 'Permission denied: Unable to create listing. This may be due to insufficient permissions.',
                    details: {
                        message: 'RLS policy violation',
                        yourRole: currentUserProfile?.role || 'unknown',
                        requiredRoles: 'admin (or agent_id must match your user ID)',
                        userId: user.id,
                        attemptedAgentId: agentId
                    },
                    userFriendly: true
                }, { status: 403 });
            }

            return NextResponse.json({
                error: error.message,
                userFriendly: true
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, listing: newListing });

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({
            error: error.message || 'An unexpected error occurred',
            userFriendly: true
        }, { status: 500 });
    }
}
