import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Stack, IconButton,
  List, ListItem, Divider, Chip, Alert, CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlagIcon from '@mui/icons-material/Flag';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { videoService } from '../services/api';

// Convert any file URL (relative or absolute) into a path that
// the CRA proxy will forward to Django to avoid CORS on media files.
const buildFileUrl = (file) => {
  if (!file) return '';
  const backend = process.env.REACT_APP_API_URL || '';
  
  // Django typically returns a full URL like:
  //   https://backend.onrender.com/media/videos/xyz.mp4
  // or a path like:
  //   /media/videos/xyz.mp4
  
  if (file.startsWith('http')) {
    if (backend) return file;
    try { return new URL(file).pathname; } catch { return file; }
  }
  
  // Relative path: prepend backend in production
  if (backend) {
    return `${backend}${file.startsWith('/') ? '' : '/'}${file}`;
  }
  return file;
};

const fmt = (s) => {
  if (!s && s !== 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const VideoAnnotator = ({ video: initialVideo }) => {
  const [video, setVideo] = useState(initialVideo);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDesc, setEditDesc] = useState('');

  // AI-related state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');

  const videoRef = useRef(null);
  const aiTriggeredRef = useRef(false);

  // ------------------------------------------------------------------
  // AI auto-annotation
  // ------------------------------------------------------------------
  const runAutoAnnotate = useCallback(async (videoId) => {
    setAiLoading(true);
    setAiMessage('');
    setAiError('');
    try {
      const res = await videoService.autoAnnotate(videoId);
      setVideo((prev) => ({ ...prev, clips: res.data.clips }));
      setAiMessage(
        `AI analyzed the video and generated ${res.data.clips_created} clips. Review and edit below.`
      );
    } catch (err) {
      console.error(err);
      setAiError(
        err.response?.data?.error ||
        'AI annotation failed. Check backend logs.'
      );
    } finally {
      setAiLoading(false);
    }
  }, []);

  // ------------------------------------------------------------------
  // Load video; auto-run AI if no clips exist yet
  // ------------------------------------------------------------------
  useEffect(() => {
    let active = true;
    aiTriggeredRef.current = false;

    (async () => {
      try {
        const r = await videoService.getVideo(initialVideo.id);
        if (!active) return;
        setVideo(r.data);

        if (
          !aiTriggeredRef.current &&
          (!r.data.clips || r.data.clips.length === 0)
        ) {
          aiTriggeredRef.current = true;
          await runAutoAnnotate(initialVideo.id);
        }
      } catch (err) {
        console.error('Failed to load video:', err);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialVideo.id, runAutoAnnotate]);

  // ------------------------------------------------------------------
  // Manual marker handlers
  // ------------------------------------------------------------------
  const handleMarkStart = () => {
    setStartTime(currentTime);
    if (endTime !== null && endTime <= currentTime) setEndTime(null);
  };

  const handleMarkEnd = () => {
    if (startTime === null) {
      setError('Mark a start time first.');
      return;
    }
    if (currentTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }
    setEndTime(currentTime);
    setError('');
  };

  const handleSaveClip = async () => {
    if (startTime === null || endTime === null || !description.trim()) {
      setError('Fill start, end, and description.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await videoService.addClip(video.id, {
        start_time: startTime,
        end_time: endTime,
        description: description.trim(),
      });
      setVideo({ ...video, clips: [...(video.clips || []), res.data] });
      setStartTime(null);
      setEndTime(null);
      setDescription('');
    } catch (err) {
      setError('Could not save clip.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClip = async (id) => {
    if (!window.confirm('Delete this clip?')) return;
    await videoService.deleteClip(video.id, id);
    setVideo({ ...video, clips: video.clips.filter((c) => c.id !== id) });
  };

  const handleSaveEdit = async (clip) => {
    const res = await videoService.updateClip(video.id, clip.id, {
      description: editDesc,
    });
    setVideo({
      ...video,
      clips: video.clips.map((c) => (c.id === clip.id ? res.data : c)),
    });
    setEditingId(null);
  };

  const seek = (t) => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = t;
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (err) {
      console.warn('Seek failed:', err);
    }
    setPlaying(true);
  };

  const clips = video.clips || [];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        gap: 3,
      }}
    >
      {/* ================= LEFT: player + manual markers ================= */}
      <Box>
        <Paper elevation={3} sx={{ p: 1, bgcolor: '#000' }}>
          <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
            <video
              ref={videoRef}
              src={buildFileUrl(video.file)}
              controls
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onError={(e) =>
                console.error(
                  'Video load error:',
                  e.currentTarget.error,
                  'src =',
                  e.currentTarget.src
                )
              }
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
              }}
            />
          </Box>
        </Paper>

        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Add a clip manually
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip
              label={`Now: ${fmt(currentTime)}`}
              color="primary"
              variant="outlined"
            />
            <Button
              variant="outlined"
              startIcon={<FlagIcon />}
              onClick={handleMarkStart}
            >
              Mark Start
            </Button>
            <Chip
              label={startTime === null ? '— : —' : fmt(startTime)}
              color="success"
              variant="outlined"
            />
            <Button
              variant="outlined"
              startIcon={<FlagIcon />}
              onClick={handleMarkEnd}
            >
              Mark End
            </Button>
            <Chip
              label={endTime === null ? '— : —' : fmt(endTime)}
              color="warning"
              variant="outlined"
            />
          </Stack>

          <TextField
            fullWidth
            label="What's happening in this segment?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            minRows={2}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
            }
            onClick={handleSaveClip}
            disabled={saving}
            sx={{ mt: 1 }}
          >
            Save Clip
          </Button>
        </Paper>
      </Box>

      {/* ================= RIGHT: clips list ================= */}
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="h6">Clips ({clips.length})</Typography>
          {aiLoading && (
            <Chip
              icon={<CircularProgress size={14} color="inherit" />}
              label="AI analyzing…"
              color="secondary"
              size="small"
            />
          )}
        </Stack>

        {aiLoading && (
          <Alert severity="info" icon={<SmartToyIcon />} sx={{ mb: 2 }}>
            <strong>AI is analyzing your video…</strong>
            <br />
            Detecting scenes and generating descriptions. This can take up to 90
            seconds.
          </Alert>
        )}

        {aiMessage && !aiLoading && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setAiMessage('')}
          >
            {aiMessage}
          </Alert>
        )}

        {aiError && !aiLoading && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setAiError('')}
          >
            {aiError}
          </Alert>
        )}

        <Paper>
          {!aiLoading && clips.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              No clips yet. AI is processing — or mark start/end manually above.
            </Box>
          ) : (
            <List disablePadding>
              {clips.map((clip, i) => {
                const active =
                  currentTime >= clip.start_time &&
                  currentTime <= clip.end_time;
                return (
                  <React.Fragment key={clip.id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem
                      sx={{
                        bgcolor: active ? 'action.selected' : 'inherit',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                          size="small"
                          onClick={() => seek(clip.start_time)}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fmt(clip.start_time)} – {fmt(clip.end_time)}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        {!clip.is_approved && (
                          <Chip
                            label="AI"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                        {editingId === clip.id ? (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleSaveEdit(clip)}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setEditingId(null)}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingId(clip.id);
                                setEditDesc(clip.description);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClip(clip.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Stack>

                      {editingId === clip.id ? (
                        <TextField
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          fullWidth
                          size="small"
                          sx={{ mt: 1 }}
                          multiline
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {clip.description}
                        </Typography>
                      )}
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default VideoAnnotator;