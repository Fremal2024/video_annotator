import React, { useState } from 'react';
import { videoService } from '../services/api';
import { Button, Box, Typography, Alert, LinearProgress, Stack } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';

const VideoUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setProgress(0);

    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('file', file);

    try {
      const response = await videoService.uploadVideo(formData, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      setUploading(false);
      onUploadSuccess(response.data);
      setFile(null);
      setProgress(0);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Upload failed. Are you logged in?'
      );
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
      <Stack spacing={2} alignItems="center">

        {/* PLAIN HTML FILE INPUT — always works */}
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{
            padding: '10px',
            border: '1px solid #4dabf7',
            borderRadius: 6,
            backgroundColor: '#0d1b2a',
            color: 'white',
            cursor: 'pointer',
            width: '100%',
            maxWidth: 400,
          }}
        />

        {file && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MovieIcon color="primary" />
            <Typography variant="body2">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!file || uploading}
          size="large"
        >
          Upload Video
        </Button>

        {uploading && (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">
              {progress}%
            </Typography>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
      </Stack>
    </Box>
  );
};

export default VideoUpload;