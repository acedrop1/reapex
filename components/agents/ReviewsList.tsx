'use client';

import React from 'react';
import { Box, Typography, Rating, Avatar, Divider } from '@mui/material';
import { Star, RateReview } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

interface ReviewsListProps {
  reviews: Review[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E0E0E0',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        <RateReview
          sx={{
            fontSize: 64,
            color: '#E0E0E0',
            marginBottom: '16px',
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: '#666666',
            marginBottom: '8px',
          }}
        >
          No reviews yet
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#999999',
          }}
        >
          This agent hasn't received any reviews yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {reviews.map((review, index) => (
        <Box key={review.id}>
          <Box
            sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            {/* Reviewer Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#E2C05A',
                  color: '#000000',
                  fontWeight: 600,
                }}
              >
                {review.reviewer_name.charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: 600,
                    }}
                  >
                    {review.reviewer_name}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: '#999999',
                      fontSize: '13px',
                    }}
                  >
                    {formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                    })}
                  </Typography>
                </Box>

                <Rating
                  value={review.rating}
                  readOnly
                  size="small"
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: '#FFB74D',
                    },
                    '& .MuiRating-iconEmpty': {
                      color: '#E0E0E0',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Review Text */}
            <Typography
              variant="body1"
              sx={{
                color: '#333333',
                fontSize: '16px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {review.review_text}
            </Typography>
          </Box>

          {index < reviews.length - 1 && (
            <Divider
              sx={{
                borderColor: '#E0E0E0',
                marginTop: '24px',
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}
