require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !serviceRoleKey)) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const links = [
    {
        category: "Property Tools",
        title: "New Jersey MLS (NJMLS)",
        description: "Primary MLS portal for Northern New Jersey listings, member tools, and market data.",
        url: "https://www.newjerseymls.com/",
        color_hex: "#003A70",
        order: 1,
        images: {
            logo_download: "https://logo.clearbit.com/newjerseymls.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=newjerseymls.com&sz=128"
        }
    },
    {
        category: "Property Tools",
        title: "Hudson County MLS (HCMLS) – Paragon",
        description: "HCMLS listing search and MLS workflows via Paragon login.",
        url: "https://hudson.paragonrels.com/ParagonLS/Default.mvc/Login",
        color_hex: "#0078D4",
        order: 2,
        images: {
            logo_download: "https://logo.clearbit.com/paragonrels.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=paragonrels.com&sz=128"
        }
    },
    {
        category: "Property Tools",
        title: "Garden State MLS (GSMLS) Member Portal",
        description: "GSMLS member sign-in for MLS search, tools, support, and related services.",
        url: "https://mls.gsmls.com/member/",
        color_hex: "#2E7D32",
        order: 3,
        images: {
            logo_download: "https://logo.clearbit.com/gsmls.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=gsmls.com&sz=128"
        }
    },
    {
        category: "Property Tools",
        title: "Realtors Property Resource (RPR)",
        description: "NAR’s property research platform for comps, reports, market trends, and client-ready exports.",
        url: "https://www.narrpr.com/",
        color_hex: "#0057B8",
        order: 4,
        images: {
            logo_download: "https://logo.clearbit.com/narrpr.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=narrpr.com&sz=128"
        }
    },
    {
        category: "Property Tools",
        title: "LoopNet",
        description: "Commercial real estate marketplace for leasing and sales listings.",
        url: "https://www.loopnet.com/",
        color_hex: "#E61E25",
        order: 5,
        images: {
            logo_download: "https://logo.clearbit.com/loopnet.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=loopnet.com&sz=128"
        }
    },
    {
        category: "Property Tools",
        title: "Zillow",
        description: "Consumer real estate search; also commonly used for marketing, comps, and lead routing.",
        url: "https://www.zillow.com/",
        color_hex: "#006AFF",
        order: 6,
        images: {
            logo_download: "https://logo.clearbit.com/zillow.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=zillow.com&sz=128"
        }
    },
    {
        category: "Utility Tools",
        title: "Supra eKEY",
        description: "Keybox access and key management platform used for showings and listing access control.",
        url: "https://www.supraekey.com/",
        color_hex: "#00A3E0",
        order: 7,
        images: {
            logo_download: "https://logo.clearbit.com/supraekey.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=supraekey.com&sz=128"
        }
    },
    {
        category: "Utility Tools",
        title: "ShowingTime",
        description: "Showing scheduling and listing appointment management (login portal).",
        url: "https://login.showingtime.com/ui/login",
        color_hex: "#6A1B9A",
        order: 8,
        images: {
            logo_download: "https://logo.clearbit.com/showingtime.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=showingtime.com&sz=128"
        }
    },
    {
        category: "Utility Tools",
        title: "DocuSign",
        description: "E-signature and agreement workflow platform for offers, disclosures, and transaction docs.",
        url: "https://www.docusign.com/",
        color_hex: "#1C4E8C",
        order: 9,
        images: {
            logo_download: "https://logo.clearbit.com/docusign.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=docusign.com&sz=128"
        }
    },
    {
        category: "Utility Tools",
        title: "dotloop",
        description: "Real estate transaction management for forms, tasks, compliance, and collaboration.",
        url: "https://www.dotloop.com/",
        color_hex: "#FF6A00",
        order: 10,
        images: {
            logo_download: "https://logo.clearbit.com/dotloop.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=dotloop.com&sz=128"
        }
    },
    {
        category: "Utility Tools",
        title: "NJREC License Renewal Portal",
        description: "State portal for New Jersey real estate licensing login/renewal (DOBI RELOLSRV).",
        url: "https://www-dobi.nj.gov/DOBI_RELOLSRV/LicenseeLogin",
        color_hex: "#0B3D91",
        order: 11,
        images: {
            logo_download: "https://logo.clearbit.com/nj.gov",
            favicon_download: "https://www.google.com/s2/favicons?domain=nj.gov&sz=128"
        }
    },
    {
        category: "Utility Tools",
        title: "National Association of REALTORS® (NAR)",
        description: "Member resources including Code of Ethics, legal updates, education, and discounts.",
        url: "https://www.nar.realtor/",
        color_hex: "#0072CE",
        order: 12,
        images: {
            logo_download: "https://logo.clearbit.com/nar.realtor",
            favicon_download: "https://www.google.com/s2/favicons?domain=nar.realtor&sz=128"
        }
    },
    {
        category: "Utility Tools",
        title: "NJ Property Records",
        description: "Public-facing property record lookup for New Jersey parcels and related data.",
        url: "https://njpropertyrecords.com/",
        color_hex: "#2D3E50",
        order: 13,
        images: {
            logo_download: "https://logo.clearbit.com/njpropertyrecords.com",
            favicon_download: "https://www.google.com/s2/favicons?domain=njpropertyrecords.com&sz=128"
        }
    },
    {
        category: "Utility Tools",
        title: "FEMA FloodSmart",
        description: "Flood insurance and flood-risk resources; useful for disclosures and due diligence.",
        url: "https://www.floodsmart.gov/",
        color_hex: "#005288",
        order: 14,
        images: {
            logo_download: "https://logo.clearbit.com/floodsmart.gov",
            favicon_download: "https://www.google.com/s2/favicons?domain=floodsmart.gov&sz=128"
        }
    }
];

async function uploadImage(link, adminClient) {
    const urlsToTry = [];
    if (link.images?.logo_download) urlsToTry.push(link.images.logo_download);
    if (link.images?.favicon_download) urlsToTry.push(link.images.favicon_download);
    // Add DuckDuckGo fallback
    try {
        const domain = new URL(link.url).hostname;
        urlsToTry.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    } catch (e) { }

    for (const url of urlsToTry) {
        if (!url) continue;
        try {
            console.log(`Downloading image for ${link.title} from ${url}...`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (response.status === 403 || response.status === 404) {
                // Silent fail for expected errors to try next url
                continue;
            }

            if (!response.ok) {
                continue;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Generate distinct filename
            const sanitize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const ext = url.endsWith('.ico') || url.includes('duckduckgo') ? 'ico' : 'png';
            const fileName = `${sanitize(link.title)}-icon.${ext}`;

            // Upload
            const { data, error } = await adminClient.storage
                .from('external_links')
                .upload(fileName, buffer, {
                    contentType: ext === 'ico' ? 'image/x-icon' : 'image/png',
                    upsert: true
                });

            if (error) {
                console.warn(`Upload failed for ${link.title}:`, error.message);
                continue;
            }

            const { data: { publicUrl } } = adminClient.storage
                .from('external_links')
                .getPublicUrl(fileName);

            console.log(`Successfully uploaded icon for ${link.title}: ${publicUrl}`);
            return publicUrl;
        } catch (error) {
            // console.warn(`Error processing image from ${url}:`, error.message);
        }
    }
    return null;
}

async function seedLinks() {
    console.log('Seeding External Links Start...');

    // Use admin privileges if available
    const adminClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }) : supabase;

    if (!serviceRoleKey) {
        console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not found. Operations may fail due to RLS.');
    }

    // Attempt to create bucket once at start
    try {
        const { data: buckets } = await adminClient.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === 'external_links');

        if (!bucketExists) {
            console.log('Creating "external_links" storage bucket...');
            const { error: createError } = await adminClient.storage.createBucket('external_links', {
                public: true,
                fileSizeLimit: 1048576,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/x-icon', 'image/svg+xml', 'image/webp']
            });
            if (createError) console.warn('Failed to create bucket:', createError.message);
            else console.log('Bucket "external_links" created successfully.');
        } else {
            console.log('Bucket "external_links" exists.');
        }
    } catch (err) {
        console.warn('Error checking/creating bucket:', err.message);
    }

    // Process Links
    for (const link of links) {
        // Handle Image Upload
        let icon_url = await uploadImage(link, adminClient);

        // Prepare Payload
        const payload = {
            title: link.title,
            url: link.url,
            description: link.description,
            color_hex: link.color_hex,
            category: link.category,
            display_order: link.order,
            order: link.order
        };

        if (icon_url) {
            payload.icon_url = icon_url;
        }

        // Check if exists
        const { data: existing } = await adminClient
            .from('external_links')
            .select('id')
            .eq('title', link.title)
            .single();

        if (!existing) {
            let { error } = await adminClient.from('external_links').insert(payload);

            if (error && (error.message.includes('category') || error.code === '42703')) {
                console.warn(`Insert failed for ${link.title} (missing columns). Retrying (Safe Mode)...`);

                const safePayload = {
                    title: link.title,
                    url: link.url,
                    display_order: link.order
                };

                const retry = await adminClient.from('external_links').insert(safePayload);
                if (retry.error) {
                    console.error(`Retry failed for ${link.title}:`, retry.error.message);
                } else {
                    console.log(`Inserted (SAFE MODE): ${link.title}`);
                }
            } else if (error) {
                console.error(`Error inserting ${link.title}:`, error.message);
            } else {
                console.log(`Inserted: ${link.title}`);
            }
        } else {
            // Update
            let { error } = await adminClient
                .from('external_links')
                .update(payload)
                .eq('id', existing.id);

            if (error) {
                // console.warn(`Update failed for ${link.title}. Retrying (Safe Mode)...`);
                const safeUpdate = {
                    url: link.url,
                    display_order: link.order
                };

                const retry = await adminClient.from('external_links').update(safeUpdate).eq('id', existing.id);
                if (retry.error) console.error(`Retry update failed for ${link.title}:`, retry.error.message);
                else console.log(`Updated (SAFE MODE): ${link.title}`);
            } else {
                console.log(`Updated: ${link.title}`);
            }
        }
    }
    console.log('Seeding complete!');
}

seedLinks().catch(console.error);
