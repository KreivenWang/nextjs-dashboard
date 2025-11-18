'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type ArtplayerType from 'artplayer';
import type HlsType from 'hls.js';

interface VideoPlayerProps {
  // 可以添加自定义属性
}

const VideoPlayer: React.FC<VideoPlayerProps> = () => {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<ArtplayerType | null>(null);
  const hlsRef = useRef<HlsType | null>(null);

  // 播放器状态
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [currentEpisodes, setCurrentEpisodes] = useState<string[]>([]);
  const [episodesReversed, setEpisodesReversed] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [videoHasEnded, setVideoHasEnded] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 解析URL参数
  useEffect(() => {
    // 从URL参数获取视频信息
    const urlParams = new URLSearchParams(window.location.search);
    let videoUrl = urlParams.get('url') || '';
    const title = urlParams.get('title') || '';
    const sourceCode = urlParams.get('source');
    let index = parseInt(urlParams.get('index') || '0');
    const episodesList = urlParams.get('episodes'); // 从URL获取集数信息
    const savedPosition = parseInt(urlParams.get('position') || '0'); // 获取保存的播放位置

    // 解决历史记录问题：检查URL是否是player.html开头的链接
    // 如果是，说明这是历史记录重定向，需要解析真实的视频URL
    if (videoUrl && videoUrl.includes('player.html')) {
      try {
        // 尝试从嵌套URL中提取真实的视频链接
        const nestedUrlParams = new URLSearchParams(videoUrl.split('?')[1]);
        // 从嵌套参数中获取真实视频URL
        const nestedVideoUrl = nestedUrlParams.get('url');
        // 检查嵌套URL是否包含播放位置信息
        const nestedPosition = nestedUrlParams.get('position');
        const nestedIndex = nestedUrlParams.get('index');
        const nestedTitle = nestedUrlParams.get('title');

        if (nestedVideoUrl) {
          videoUrl = nestedVideoUrl;

          // 更新当前URL参数
          const url = new URL(window.location.href);
          if (!urlParams.has('position') && nestedPosition) {
            url.searchParams.set('position', nestedPosition);
          }
          if (!urlParams.has('index') && nestedIndex) {
            url.searchParams.set('index', nestedIndex);
          }
          if (!urlParams.has('title') && nestedTitle) {
            url.searchParams.set('title', nestedTitle);
          }
          // 替换当前URL
          window.history.replaceState({}, '', url);
        } else {
          setError('历史记录链接无效，请返回首页重新访问');
        }
      } catch (e) {
        console.error('解析嵌套URL失败:', e);
      }
    }

    setCurrentVideoUrl(videoUrl);
    setCurrentVideoTitle(title || localStorage.getItem('currentVideoTitle') || '未知视频');
    setCurrentEpisodeIndex(index);

    // 保存当前视频URL
    // 从localStorage获取数据
    setCurrentVideoTitle(title || localStorage.getItem('currentVideoTitle') || '未知视频');
    setCurrentEpisodeIndex(index);

    // 设置自动连播开关状态
    const savedAutoplay = localStorage.getItem('autoplayEnabled') !== 'false'; // 默认为true
    setAutoplayEnabled(savedAutoplay);

    // 优先使用URL传递的集数信息，否则从localStorage获取
    try {
      let episodesArray = [];
      if (episodesList) {
        // 如果URL中有集数数据，优先使用它
        episodesArray = JSON.parse(decodeURIComponent(episodesList));
      } else {
        // 否则从localStorage获取
        episodesArray = JSON.parse(localStorage.getItem('currentEpisodes') || '[]');
      }

      // 检查集数索引是否有效，如果无效则调整为0
      if (index < 0 || (episodesArray.length > 0 && index >= episodesArray.length)) {
        // 如果索引太大，则使用最大有效索引
        if (index >= episodesArray.length && episodesArray.length > 0) {
          index = episodesArray.length - 1;
        } else {
          index = 0;
        }

        // 更新URL以反映修正后的索引
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('index', String(index));
        window.history.replaceState({}, '', newUrl);
      }

      // 更新当前索引为验证过的值
      setCurrentEpisodeIndex(index);
      setCurrentEpisodes(episodesArray);

      const episodesReversedFromStorage = localStorage.getItem('episodesReversed') === 'true';
      setEpisodesReversed(episodesReversedFromStorage);
    } catch (e) {
      setCurrentEpisodes([]);
      setCurrentEpisodeIndex(0);
      setEpisodesReversed(false);
      console.error('解析集数数据失败:', e);
    }

    // 设置页面标题
    document.title = (title || '未知视频') + ' - TenInkyTV';
  }, []); // 现在只在组件挂载时执行一次

  // 初始化播放器
  useEffect(() => {
    if (!containerRef.current || !currentVideoUrl) return;

    const initPlayer = async () => {
      // 动态导入ArtPlayer和HLS
      const [{ default: Artplayer }, { default: Hls }] = await Promise.all([
        import('artplayer'),
        import('hls.js')
      ]);

      // 销毁旧实例
      if (artRef.current) {
        artRef.current.destroy();
        artRef.current = null;
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // 创建新的ArtPlayer实例
      artRef.current = new Artplayer({
        container: containerRef.current!,
        url: currentVideoUrl,
        type: 'm3u8',
        // title: currentVideoTitle,
        volume: 0.8,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: true,
        screenshot: true,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: false,
        airplay: true,
        hotkey: false,
        theme: '#23ade5',
        lang: navigator.language.toLowerCase(),
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
        customType: {
          m3u8: (video: HTMLVideoElement, url: string) => {
            if (hlsRef.current) {
              hlsRef.current.destroy();
            }

            const hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              maxBufferSize: 30 * 1000 * 1000,
              maxBufferHole: 0.5,
              fragLoadingMaxRetry: 6,
              fragLoadingMaxRetryTimeout: 64000,
              fragLoadingRetryDelay: 1000,
              manifestLoadingMaxRetry: 3,
              manifestLoadingRetryDelay: 1000,
              levelLoadingMaxRetry: 4,
              levelLoadingRetryDelay: 1000,
              startLevel: -1,
              abrEwmaDefaultEstimate: 500000,
              abrBandWidthFactor: 0.95,
              abrBandWidthUpFactor: 0.7,
              abrMaxWithRealBitrate: true,
              stretchShortVideoTrack: true,
              appendErrorMaxRetry: 5,
              liveSyncDurationCount: 3,
              liveDurationInfinity: false
            });

            hlsRef.current = hls;

            let errorCount = 0;
            let playbackStarted = false;
            let bufferAppendErrorCount = 0;

            // 监听视频播放事件
            video.addEventListener('playing', () => {
              playbackStarted = true;
              setIsLoading(false);
              setError(null);
            });

            // 监听视频进度事件
            video.addEventListener('timeupdate', () => {
              if (video.currentTime > 1) {
                setError(null);
              }
            });

            hls.loadSource(url);
            hls.attachMedia(video);

            // enable airplay
            const sourceElement = video.querySelector('source');
            if (sourceElement) {
              sourceElement.src = currentVideoUrl;
            } else {
              const newSource = document.createElement('source');
              newSource.src = currentVideoUrl;
              video.appendChild(newSource);
            }
            video.disableRemotePlayback = false;

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(e => {
                console.error('播放失败:', e);
              });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              errorCount++;

              if (data.details === 'bufferAppendError') {
                bufferAppendErrorCount++;
                if (playbackStarted) {
                  return;
                }

                if (bufferAppendErrorCount >= 3) {
                  hls.recoverMediaError();
                }
              }

              if (data.fatal && !playbackStarted) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    if (errorCount > 3) {
                      setError('视频加载失败，可能是格式不兼容或源不可用');
                    }
                    break;
                }
              }
            });

            // 监听分段加载事件
            hls.on(Hls.Events.FRAG_LOADED, () => {
              setIsLoading(false);
            });

            // 监听级别加载事件
            hls.on(Hls.Events.LEVEL_LOADED, () => {
              setIsLoading(false);
            });
          }
        }
      });

      // 播放器准备就绪事件
      artRef.current.on('ready', () => {
        setIsLoading(false);

        // 尝试恢复播放位置
        setTimeout(() => {
          if (searchParams.get('position')) {
            const position = parseInt(searchParams.get('position') || '0');
            if (position > 10 && position < artRef.current!.duration - 2) {
              artRef.current!.currentTime = position;
            }
          } else {
            // 尝试从本地存储恢复播放进度
            try {
              const progressKey = `videoProgress_${currentVideoUrl}`;
              const progressStr = localStorage.getItem(progressKey);
              if (progressStr && artRef.current!.duration > 0) {
                const progress = JSON.parse(progressStr);
                if (
                  progress &&
                  typeof progress.position === 'number' &&
                  progress.position > 10 &&
                  progress.position < artRef.current!.duration - 2
                ) {
                  artRef.current!.currentTime = progress.position;
                }
              }
            } catch (e) {
              console.error('恢复播放进度失败:', e);
            }
          }
        }, 1000);

        // 启动定期保存播放进度
        startProgressSaveInterval();
      });

      // 错误处理
      artRef.current.on('video:error', (error) => {
        setIsLoading(false);
        setError('视频播放失败: ' + (error.message || '未知错误'));
      });

      // 视频播放结束事件
      artRef.current.on('video:ended', () => {
        setVideoHasEnded(true);
        clearVideoProgress();

        if (autoplayEnabled && currentEpisodeIndex < currentEpisodes.length - 1) {
          setTimeout(() => {
            playNextEpisode();
            setVideoHasEnded(false);
          }, 1000);
        } else {
          artRef.current!.fullscreen = false;
        }
      });
    };

    initPlayer();

    // 清理函数
    return () => {
      if (artRef.current) {
        artRef.current.destroy();
        artRef.current = null;
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentVideoUrl, currentVideoTitle, currentEpisodes.length, currentEpisodeIndex, autoplayEnabled]);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!artRef.current) return;
      
      // 忽略输入框中的按键事件
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Alt + 左箭头 = 上一集
      if (e.altKey && e.key === 'ArrowLeft') {
        if (currentEpisodeIndex > 0) {
          playPreviousEpisode();
          e.preventDefault();
        }
        return;
      }

      // Alt + 右箭头 = 下一集
      if (e.altKey && e.key === 'ArrowRight') {
        if (currentEpisodeIndex < currentEpisodes.length - 1) {
          playNextEpisode();
          e.preventDefault();
        }
        return;
      }

      // 左箭头 = 快退
      if (!e.altKey && e.key === 'ArrowLeft') {
        if (artRef.current.currentTime > 5) {
          artRef.current.currentTime -= 5;
          e.preventDefault();
        }
        return;
      }

      // 右箭头 = 快进
      if (!e.altKey && e.key === 'ArrowRight') {
        if (artRef.current.currentTime < artRef.current.duration - 5) {
          artRef.current.currentTime += 5;
          e.preventDefault();
        }
        return;
      }

      // 上箭头 = 音量+
      if (e.key === 'ArrowUp') {
        if (artRef.current.volume < 1) {
          artRef.current.volume += 0.1;
          e.preventDefault();
        }
        return;
      }

      // 下箭头 = 音量-
      if (e.key === 'ArrowDown') {
        if (artRef.current.volume > 0) {
          artRef.current.volume -= 0.1;
          e.preventDefault();
        }
        return;
      }

      // 空格 = 播放/暂停
      if (e.key === ' ') {
        artRef.current.toggle();
        e.preventDefault();
        return;
      }

      // f 键 = 切换全屏
      if (e.key === 'f' || e.key === 'F') {
        artRef.current.fullscreen = !artRef.current.fullscreen;
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEpisodeIndex, currentEpisodes.length]);

  // 添加页面离开事件监听，保存播放位置
  useEffect(() => {
    const saveProgressOnLeave = () => {
      saveCurrentProgress();
    };

    window.addEventListener('beforeunload', saveProgressOnLeave);
    
    // 页面隐藏（切后台/切标签）时也保存
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentProgress();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', saveProgressOnLeave);
      document.removeEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          saveCurrentProgress();
        }
      });
    };
  }, []);

  // 启动定期保存播放进度
  const startProgressSaveInterval = () => {
    // 视频暂停时也保存
    if (artRef.current && artRef.current.video) {
      artRef.current.video.addEventListener('pause', saveCurrentProgress);

      // 播放进度变化时节流保存
      let lastSave = 0;
      artRef.current.video.addEventListener('timeupdate', () => {
        const now = Date.now();
        if (now - lastSave > 5000) { // 每5秒最多保存一次
          saveCurrentProgress();
          lastSave = now;
        }
      });
    }
  };

  // 保存当前播放进度
  const saveCurrentProgress = () => {
    if (!artRef.current || !artRef.current.video) return;
    const currentTime = artRef.current.video.currentTime;
    const duration = artRef.current.video.duration;
    if (!duration || currentTime < 1) return;

    // 在localStorage中保存进度
    const progressKey = `videoProgress_${currentVideoUrl}`;
    const progressData = {
      position: currentTime,
      duration: duration,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(progressKey, JSON.stringify(progressData));
    } catch (e) {
      console.error('保存播放进度失败:', e);
    }
  };

  // 清除视频进度记录
  const clearVideoProgress = () => {
    const progressKey = `videoProgress_${currentVideoUrl}`;
    try {
      localStorage.removeItem(progressKey);
    } catch (e) {
      console.error('清除播放进度失败:', e);
    }
  };

  // 播放上一集
  const playPreviousEpisode = () => {
    if (currentEpisodeIndex > 0) {
      playEpisode(currentEpisodeIndex - 1);
    }
  };

  // 播放下一集
  const playNextEpisode = () => {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
      playEpisode(currentEpisodeIndex + 1);
    }
  };

  // 播放指定集数
  const playEpisode = (index: number) => {
    if (index < 0 || index >= currentEpisodes.length) return;

    // 保存当前播放进度
    saveCurrentProgress();

    // 隐藏错误，显示加载指示器
    setError(null);
    setIsLoading(true);

    // 更新当前剧集索引
    const url = currentEpisodes[index];
    setCurrentEpisodeIndex(index);
    setCurrentVideoUrl(url);
    setVideoHasEnded(false);

    // 清除进度记录
    clearVideoProgress();

    // 更新URL参数
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('index', index.toString());
    newUrl.searchParams.set('url', url);
    newUrl.searchParams.delete('position');
    window.history.replaceState({}, '', newUrl.toString());

    // 如果支持切换，直接切换视频
    if (artRef.current) {
      artRef.current.url = url;
    }
  };

  // 切换集数排序
  const toggleEpisodeOrder = () => {
    const newReversed = !episodesReversed;
    setEpisodesReversed(newReversed);
    localStorage.setItem('episodesReversed', newReversed.toString());
  };

  // 处理自动连播开关变化
  const handleAutoplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setAutoplayEnabled(enabled);
    localStorage.setItem('autoplayEnabled', enabled.toString());
  };

  // 复制链接
  const copyLinks = () => {
    navigator.clipboard.writeText(currentVideoUrl)
      .then(() => {
        alert('播放链接已复制');
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请检查浏览器权限');
      });
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white">
      {/* 播放器头部 */}
      <header className="player-header-fixed p-2 flex items-center border-b border-[#333] gap-2 bg-gray-800">
        <div className="flex items-center min-w-0">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center px-3 py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors min-w-0"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11h14M5 11a2 2 0 110-4h14a2 2 0 010 4M5 11v9a2 2 0 002 2h10a2 2 0 002-2v-9M5 11v-9a2 2 0 012-2h10a2 2 0 012 2v9" />
            </svg>
            <span className="home-btn-text">返回</span>
          </button>
        </div>
        <h2 className="text-lg font-semibold flex-1 text-center overflow-x-auto whitespace-nowrap truncate px-4">
          {currentVideoTitle}
        </h2>
        <div className="min-w-0">
          <span className="text-sm text-gray-400">
            第 {currentEpisodeIndex + 1}/{currentEpisodes.length} 集
          </span>
        </div>
      </header>

      {/* 视频播放区 */}
      <div className="flex-1 relative" ref={containerRef}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2">正在加载视频...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="flex flex-col items-center text-red-500">
              <div className="text-4xl mb-2">⚠️</div>
              <p>{error}</p>
              <p className="text-gray-400 text-sm mt-2">请尝试其他视频源或稍后重试</p>
            </div>
          </div>
        )}
      </div>

      {/* 播放控制区 */}
      <div className="p-4 bg-gray-800">
        {/* 集数导航 */}
        <div className="flex justify-between items-center my-2">
          <button
            onClick={playPreviousEpisode}
            disabled={currentEpisodeIndex <= 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentEpisodeIndex <= 0
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-[#222] hover:bg-[#333] border border-[#333]'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              上一集
            </div>
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-sm">
              {currentEpisodes.length > 0
                ? `第 ${currentEpisodeIndex + 1}/${currentEpisodes.length} 集`
                : '无集数信息'}
            </span>
            <div className="flex items-center mt-1">
              <span className="text-gray-400 text-sm mr-2">自动连播</span>
              <label className="relative inline-flex items-center cursor-pointer ml-2">
                <input
                  type="checkbox"
                  checked={autoplayEnabled}
                  onChange={handleAutoplayChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          <button
            onClick={playNextEpisode}
            disabled={currentEpisodeIndex >= currentEpisodes.length - 1}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentEpisodeIndex >= currentEpisodes.length - 1
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-[#222] hover:bg-[#333] border border-[#333]'
            }`}
          >
            <div className="flex items-center">
              下一集
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </button>
        </div>

        {/* 功能按钮 */}
        <div className="flex flex-wrap justify-between items-center gap-2 mt-3">
          <div className="flex items-center gap-2">
            {/* 倒序排列按钮 */}
            <button
              onClick={toggleEpisodeOrder}
              className="px-3 py-1 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              <span>{episodesReversed ? '正序排列' : '倒序排列'}</span>
            </button>

            {/* 复制链接按钮 */}
            <button
              onClick={copyLinks}
              title="复制播放链接"
              className="px-2 py-1 bg-[#222] hover:bg-[#333] border border-[#333] text-white rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>

        {/* 集数网格 */}
        {currentEpisodes.length > 0 && (
          <div className="mt-4">
            <div className="episode-grid">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {currentEpisodes.map((_, index) => {
                  const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
                  const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;
                  const isActive = realIndex === currentEpisodeIndex;

                  return (
                    <button
                      key={index}
                      onClick={() => playEpisode(realIndex)}
                      className={`px-3 py-2 ${
                        isActive 
                          ? 'bg-blue-600 text-white border border-blue-500' 
                          : 'bg-[#222] hover:bg-[#333] border border-[#333] text-gray-200'
                      } rounded-lg transition-colors text-center`}
                    >
                      {realIndex + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;