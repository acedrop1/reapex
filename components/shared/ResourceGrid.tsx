'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Trash,
    ArrowSquareOut,
    FileText,
    FilePdf,
    FileDoc,
    FilePpt,
    FileXls,
    File as FileIcon,
    Video,
    Image as ImageIcon,
    Link as LinkIcon,
} from '@phosphor-icons/react';

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
        /(?:youtu\.be\/)([^?\s]+)/,
        /(?:youtube\.com\/embed\/)([^?\s]+)/,
        /(?:youtube\.com\/shorts\/)([^?\s]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Get a thumbnail URL from any resource URL (YouTube, etc.)
function getAutoThumbnail(url: string | undefined | null): string | null {
    if (!url) return null;
    // YouTube
    const ytId = getYouTubeVideoId(url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return null;
}

export interface ResourceItem {
    id: string;
    title: string;
    description?: string | null;
    category?: string;
    type?: 'video' | 'pdf' | 'slides' | 'spreadsheet' | 'document' | 'link' | 'image' | 'template';
    url?: string;
    thumbnail_url?: string | null;
    preview_url?: string | null;
    video_url?: string | null;
    file_type?: string;
    tags?: string[];
    color?: string;
    logo_url?: string | null;
    canva_url?: string;
    created_at?: string;
}

interface ResourceGridProps {
    items: ResourceItem[];
    onItemClick?: (item: ResourceItem) => void;
    isAdmin?: boolean;
    onDelete?: (item: ResourceItem) => void;
    onEdit?: (item: ResourceItem) => void;
    cardHeight?: number;
}

export default function ResourceGrid({
    items,
    onItemClick,
    isAdmin,
    onDelete,
    onEdit,
}: ResourceGridProps) {

    // Helper to get icon based on type
    const getIcon = (item: ResourceItem, size = 50) => {
        const type = item.type || 'document';
        const weight = 'duotone';

        if (type === 'video') return <Video size={size} weight={weight} color="#E53935" />;
        if (type === 'pdf') return <FilePdf size={size} weight={weight} color="#F44336" />;
        if (type === 'slides') return <FilePpt size={size} weight={weight} color="#FF6F00" />;
        if (type === 'spreadsheet') return <FileXls size={size} weight={weight} color="#1B5E20" />;
        if (type === 'link') return <LinkIcon size={size} weight={weight} color={item.color || "#E2C05A"} />;
        if (type === 'template' || type === 'image') return <ImageIcon size={size} weight={weight} color="#c49d2f" />;
        if (type === 'document') return <FileDoc size={size} weight={weight} color="#C4A43B" />;

        return <FileText size={size} weight={weight} color="#C4A43B" />;
    };

    // Helper to get color based on type
    const getColor = (item: ResourceItem) => {
        if (item.color) return item.color;

        const type = item.type || 'document';

        if (type === 'video') return '#E53935';
        if (type === 'pdf') return '#F44336';
        if (type === 'slides') return '#FF6F00';
        if (type === 'spreadsheet') return '#1B5E20';
        if (type === 'link') return '#E2C05A';
        if (type === 'template' || type === 'image') return '#c49d2f';
        if (type === 'document') return '#C4A43B';

        return '#C4A43B';
    };

    return (
        <Grid container spacing={4}>
            {items.map((item) => {
                const color = getColor(item);

                return (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
                        <Tooltip
                            title={item.description || ''}
                            placement="top"
                            arrow
                            componentsProps={{
                                tooltip: {
                                    sx: {
                                        backgroundColor: '#1E1E1E',
                                        color: '#FFFFFF',
                                        fontSize: '0.75rem',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #2A2A2A',
                                        maxWidth: '300px',
                                    },
                                },
                                arrow: {
                                    sx: {
                                        color: '#1E1E1E',
                                        '&::before': {
                                            border: '1px solid #2A2A2A',
                                        },
                                    },
                                },
                            }}
                        >
                            <Box
                                onClick={() => onItemClick && onItemClick(item)}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    '&:hover': {
                                        '& .icon-container': {
                                            transform: 'scale(1.05)',
                                            backgroundColor: '#1A1A1A',
                                        },
                                        '& .resource-name': {
                                            color: color,
                                        },
                                    },
                                }}
                            >
                            {/* iOS-Style Icon Container */}
                            <Box
                                className="icon-container"
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '22px', // iOS-style rounded corners
                                    backgroundColor: '#121212',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Display image/logo if available, or auto-thumbnail from URL */}
                                {(item.thumbnail_url || item.preview_url || item.logo_url || getAutoThumbnail(item.url) || getAutoThumbnail(item.video_url)) ? (
                                    <Box
                                        component="img"
                                        src={item.thumbnail_url || item.preview_url || item.logo_url || getAutoThumbnail(item.url) || getAutoThumbnail(item.video_url) || ''}
                                        alt={item.title}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '22px',
                                        }}
                                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                            // If image fails to load, hide it and show icon instead
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    // Show icon
                                    getIcon(item, 50)
                                )}
                            </Box>

                            {/* Resource Name */}
                            <Typography
                                className="resource-name"
                                variant="body2"
                                sx={{
                                    color: '#FFFFFF',
                                    fontWeight: 500,
                                    textAlign: 'center',
                                    transition: 'color 0.2s ease',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    maxWidth: '120px',
                                }}
                            >
                                {item.title}
                            </Typography>
                        </Box>
                        </Tooltip>
                    </Grid>
                );
            })}
        </Grid>
    );
}
