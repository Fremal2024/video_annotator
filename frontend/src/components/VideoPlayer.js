import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import {
  Box,
  Typography,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemButton,
  Divider,
  LinearProgress,
  Stack,
  Tooltip,
  Card,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';

// Build a full URL to the media file served by Django
const buildFileUrl = (file) => {
  if (!file) return '';
  if (file.startsWith('http')) return file;
  const backend = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  return `${backend}${file}`;
};

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VideoPlayer = ({ video }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null);

  // Reset when a different video is selected
  useEffect(() => {
    setCurrentTime(0);
    setPlaying(false);
  }, [video?.id]);

  if (!video) return null;

  const clips = video.clips || [];
  const videoUrl = buildFileUrl(video.file);

  const currentClip = clips.find(
    (clip) => currentTime >= clip.start_time && currentTime <= clip.end_time
  );

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleClipClick = (startTime) => {
    if (playerRef.current) {
      playerRef.current.seekTo(startTime, 'seconds');
      setPlaying(true);
    }
  };

  const progressPercent = video.duration
    ? Math.min(100, (currentTime / video.duration) * 100)
    : 0;

  return (
    <Box sx={{ mt: 4 }}>
      {/* ---------- Header ---------- */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <VideocamOutlinedIcon />
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Typography
            variant="h6"
            noWrap
            sx={{ fontWeight: 600 }}
            title={video.title}
          >
            {video.title}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccessTimeIcon fontSize="small" />
            <Typography variant="body2">
              {formatTime(video.duration)} • {clips.length} clip
              {clips.length !== 1 ? 's' : ''}
            </Typography>
          </Stack>
        </Box>
        <Chip
          label={video.status}
          color={video.status === 'completed' ? 'success' : 'default'}
          size="small"
          sx={{ color: '#fff', borderColor: '#fff' }}
          variant="outlined"
        />
      </Paper>

      {/* ---------- Video Player ---------- */}
      <Paper elevation={3} sx={{ p: 1, bgcolor: '#000' }}>
        <Box sx={{ position: 'relative', paddingTop: '56.25%' /* 16:9 */ }}>
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            controls
            playing={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onProgress={handleProgress}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
          />
        </Box>
      </Paper>

      {/* ---------- Progress Bar ---------- */}
      <Box sx={{ mt: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{ height: 6, borderRadius: 3 }}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mt: 0.5 }}
        >
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(video.duration)}
          </Typography>
        </Stack>
      </Box>

      {/* ---------- Current Scene Annotation ---------- */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          CURRENT SCENE
        </Typography>
        {currentClip ? (
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderLeft: '4px solid',
              borderColor:
                currentClip.confidence_score > 0.7 ? 'success.main' : 'warning.main',
              bgcolor: 'grey.50',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <PlayArrowIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {formatTime(currentClip.start_time)} –{' '}
                {formatTime(currentClip.end_time)}
              </Typography>
              <Chip
                label={`${Math.round(currentClip.confidence_score * 100)}%`}
                color={
                  currentClip.confidence_score > 0.7 ? 'success' : 'warning'
                }
                size="small"
              />
              {currentClip.is_approved && (
                <Tooltip title="Approved">
                  <CheckCircleIcon color="success" fontSize="small" />
                </Tooltip>
              )}
            </Stack>
            <Typography variant="body1">{currentClip.description}</Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px dashed',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <InfoOutlinedIcon color="disabled" />
            <Typography variant="body2" color="text.secondary">
              No annotation for this segment
            </Typography>
          </Paper>
        )}
      </Box>

      {/* ---------- All Clips ---------- */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          All Scene Clips
        </Typography>

        {clips.length === 0 ? (
          <Paper
            elevation={0}
            sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}
          >
            <Typography color="text.secondary">
              No clips available for this video yet.
            </Typography>
          </Paper>
        ) : (
          <Card elevation={2}>
            <List disablePadding>
              {clips.map((clip, index) => {
                const isActive =
                  currentTime >= clip.start_time && currentTime <= clip.end_time;
                return (
                  <React.Fragment key={clip.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleClipClick(clip.start_time)}
                        sx={{
                          bgcolor: isActive ? 'primary.50' : 'inherit',
                          borderLeft: '4px solid',
                          borderColor: isActive
                            ? 'primary.main'
                            : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: isActive ? 'primary.100' : 'action.hover',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            width: '100%',
                            alignItems: 'flex-start',
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: 60,
                              textAlign: 'center',
                              color: 'primary.main',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                            }}
                          >
                            {formatTime(clip.start_time)}
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: isActive ? 600 : 400 }}
                            >
                              {clip.description}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={{ mt: 0.5 }}
                            >
                              <Chip
                                label={`${Math.round(
                                  clip.confidence_score * 100
                                )}%`}
                                size="small"
                                color={
                                  clip.confidence_score > 0.7
                                    ? 'success'
                                    : 'warning'
                                }
                                variant="outlined"
                              />
                              {clip.is_approved && (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Approved"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default VideoPlayer;