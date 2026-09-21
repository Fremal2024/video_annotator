import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { videoService } from '../services/api';
import './Home.css';

const Home = () => {
  // -------- Hooks --------
  const navigate = useNavigate();
  const location = useLocation();
  const upgraded = new URLSearchParams(location.search).get('upgraded') === '1';

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState(null);

  // -------- Load videos + profile on mount --------
  useEffect(() => {
    loadVideos();
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await videoService.getVideos();
      const list = response.data.results || response.data || [];
      setVideos(list);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const r = await videoService.getProfile();
      setPlanInfo(r.data);
    } catch (err) {
      // silently fail — usage meter just won't show
    }
  };

  // -------- Upload handlers --------
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setSelectedFile(f);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);

    const formData = new FormData();
    formData.append('title', selectedFile.name);
    formData.append('file', selectedFile);

    try {
      const response = await videoService.uploadVideo(formData, (evt) => {
        if (evt.total) {
          setProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      });
      setSuccess(`✅ Uploaded: ${response.data.title}`);
      setVideos([response.data, ...videos]);
      setSelectedFile(null);
      setProgress(0);
      loadProfile(); // refresh usage meter
      const input = document.getElementById('raised-button-file');
      if (input) input.value = '';
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Upload failed. Make sure you are logged in.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video and all its clips?')) return;
    try {
      await videoService.deleteVideo(id);
      setVideos(videos.filter((v) => v.id !== id));
    } catch (err) {
      alert('Failed to delete video.');
    }
  };

  // -------- Render --------
  return (
    <div className="home-container">
      {upgraded && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            background: '#1b5e20',
            borderRadius: 8,
            color: 'white',
          }}
        >
          ✅ <strong>Upgrade successful!</strong> You now have unlimited uploads.
        </div>
      )}

      <h1 className="page-title">Upload New Video</h1>

      {/* Usage meter */}
      {planInfo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            padding: '10px 16px',
            background: '#0d2137',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            fontSize: '0.9rem',
          }}
        >
          <span style={{ color: '#B2BAC2' }}>
            Plan: <strong style={{ color: '#3399FF' }}>{planInfo.plan.toUpperCase()}</strong>
          </span>
          <span style={{ color: '#B2BAC2' }}>
            · Videos this month:{' '}
            <strong style={{ color: '#fff' }}>
              {planInfo.plan === 'free' ? '5' : '∞'} allowed
            </strong>
          </span>
          {planInfo.plan === 'free' && (
            <button
              onClick={() => navigate('/pricing')}
              style={{
                marginLeft: 'auto',
                padding: '6px 14px',
                background: '#3399FF',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Upgrade
            </button>
          )}
        </div>
      )}

      {/* Upload box */}
      <div className="upload-box">
        <input
          accept="video/*"
          id="raised-button-file"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <label
          htmlFor="raised-button-file"
          style={{
            backgroundColor: '#3399FF',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1rem',
            userSelect: 'none',
          }}
        >
          <CloudUploadIcon />
          Select Video File
        </label>

        {selectedFile && (
          <p className="file-name">
            Selected: <strong>{selectedFile.name}</strong>{' '}
            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          style={{
            padding: '10px 24px',
            borderRadius: '4px',
            border: 'none',
            cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
            backgroundColor: selectedFile && !uploading ? '#1e70bf' : '#4a6a8a',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 500,
            opacity: !selectedFile || uploading ? 0.6 : 1,
          }}
        >
          {uploading ? `Uploading ${progress}%` : 'Upload Video'}
        </button>

        {uploading && (
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div
              style={{
                height: 8,
                backgroundColor: '#0A1929',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#3399FF',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
        )}

        {error && <p style={{ color: '#ff6b6b', margin: 0 }}>⚠ {error}</p>}
        {success && <p style={{ color: '#4caf50', margin: 0 }}>{success}</p>}
      </div>

      {/* Video list */}
      <h1 className="page-title">Your Videos</h1>

      {loading ? (
        <div className="video-placeholder">
          <p className="placeholder-text">Loading videos…</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="video-placeholder">
          <CloudUploadIcon className="placeholder-icon" />
          <p className="placeholder-text">
            No videos yet. Upload one to get started!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {videos.map((v) => (
            <div
              key={v.id}
              style={{
                backgroundColor: '#132F4C',
                borderRadius: 8,
                border: '1px solid #1E3A5F',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <button
                onClick={() => handleDelete(v.id)}
                title="Delete video"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ff6b6b',
                  padding: 4,
                }}
              >
                <DeleteIcon fontSize="small" />
              </button>

              <h3
                style={{
                  margin: '0 0 8px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  paddingRight: 32,
                  wordBreak: 'break-word',
                }}
                title={v.title}
              >
                {v.title}
              </h3>

              <div
                style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: '#0A1929',
                    color: '#B2BAC2',
                    border: '1px solid #1E3A5F',
                  }}
                >
                  ⏱ {v.duration || 0}s
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor:
                      v.status === 'completed' ? '#1b5e20' : '#4a6a8a',
                    color: 'white',
                  }}
                >
                  {v.status}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: '#0A1929',
                    color: '#B2BAC2',
                    border: '1px solid #1E3A5F',
                  }}
                >
                  🎬 {v.clips_count || 0} clips
                </span>
              </div>

              <button
                onClick={() => navigate(`/videos/${v.id}`)}
                style={{
                  marginTop: 'auto',
                  padding: '10px 16px',
                  backgroundColor: '#3399FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <PlayArrowIcon fontSize="small" />
                Annotate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;