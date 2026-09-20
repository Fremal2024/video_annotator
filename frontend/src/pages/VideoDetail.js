import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VideoAnnotator from '../components/VideoAnnotator';
import { videoService } from '../services/api';

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    videoService
      .getVideo(id)
      .then((r) => setVideo(r.data))
      .catch(() => setError('Video not found'));
  }, [id]);

  if (error) return <Typography sx={{ p: 4 }}>{error}</Typography>;
  if (!video)
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        Back to Videos
      </Button>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {video.title}
        </Typography>
      </Paper>
      <VideoAnnotator video={video} />
    </Box>
  );
};

export default VideoDetail;