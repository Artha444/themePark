import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

export type Tab = 'now_showing' | 'coming_soon'

export interface Movie {
  id: number
  title: string
  genre: string
  rating: string
  poster: string
  status: Tab
}

export const MOCK_MOVIES: Movie[] = [
  {
    id: 1,
    title: 'Minions',
    genre: 'Animasi · Komedi',
    rating: 'SU',
    poster: 'https://image.tmdb.org/t/p/w500/dr02BdCNAUPVU07aOodwPYv6HCf.jpg',
    status: 'now_showing',
  },
  {
    id: 2,
    title: 'Big Hero 6',
    genre: 'Animasi · Aksi',
    rating: 'SU',
    poster: 'https://image.tmdb.org/t/p/w500/2mxS4wUimwlLmI1xp6QW6NSU361.jpg',
    status: 'now_showing',
  },
  {
    id: 3,
    title: 'Spider-Man: Across the Spider-Verse',
    genre: 'Animasi · Aksi',
    rating: 'R13',
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    status: 'now_showing',
  },
  {
    id: 4,
    title: 'Avengers: Doomsday',
    genre: 'Aksi · Sci-Fi',
    rating: 'R13',
    poster: 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
    status: 'now_showing',
  },
  {
    id: 5,
    title: 'Inside Out 2',
    genre: 'Animasi · Drama',
    rating: 'SU',
    poster: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    status: 'now_showing',
  },
  {
    id: 6,
    title: 'Moana 2',
    genre: 'Animasi · Petualangan',
    rating: 'SU',
    poster: 'https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg',
    status: 'coming_soon',
  },
  {
    id: 7,
    title: 'Deadpool & Wolverine',
    genre: 'Aksi · Komedi',
    rating: 'D21',
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    status: 'coming_soon',
  },
  {
    id: 8,
    title: 'Transformers: Rise of the Beasts',
    genre: 'Aksi · Sci-Fi',
    rating: 'R13',
    poster: 'https://image.tmdb.org/t/p/w500/gPbM0MK8CP8A174rmUwGsADNYKD.jpg',
    status: 'coming_soon',
  },
]

interface MoviesSectionProps {
  activeTab?: Tab
  onTabChange?: (tab: Tab) => void
}

export default function MoviesSection({ activeTab = 'now_showing', onTabChange }: MoviesSectionProps) {
  const navigate = useNavigate()
  const filtered = MOCK_MOVIES.filter(m => m.status === activeTab)
  const total = filtered.length

  const [clickedPill, setClickedPill] = useState<string | null>(null)
  const pillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Start with Big Hero 6 (index 1) or middle index centered for now_showing to match reference
  const [currentIndex, setCurrentIndex] = useState(() => (activeTab === 'now_showing' && total > 1 ? 1 : 0))
  const [isPaused, setIsPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 680)

  const handlePillClick = (tab: Tab) => {
    if (pillTimerRef.current) clearTimeout(pillTimerRef.current)
    setClickedPill(tab)
    pillTimerRef.current = setTimeout(() => setClickedPill(null), 600)
    onTabChange?.(tab)
  }

  // Responsive mobile tracker
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 680)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Reset index when tab switches
  useEffect(() => {
    setCurrentIndex(activeTab === 'now_showing' && filtered.length > 1 ? 1 : 0)
  }, [activeTab, filtered.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + total) % total)
  }, [total])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % total)
  }, [total])

  // Auto rotation with pause on hover
  useEffect(() => {
    if (isPaused || total <= 1) return
    const timer = setInterval(() => {
      handleNext()
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, total, handleNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

  // Calculate relative offset of card compared to currentIndex (-1: left, 0: center, 1: right)
  const getCardOffset = (index: number) => {
    if (total === 0) return 0
    let diff = (index - currentIndex) % total
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return diff
  }

  const handleCardClick = (diff: number, movieId: number) => {
    if (diff === 0) {
      navigate(`/movies/${movieId}`)
    } else if (diff === -1) {
      handlePrev()
    } else if (diff === 1) {
      handleNext()
    }
  }

  // Framer Motion Dynamic Coordinates & 3D Lighting Physics
  const getMotionAnimation = (diff: number) => {
    const offsetDistance = isMobile ? 125 : 215

    if (diff === 0) {
      return {
        x: 0,
        y: 0,
        scale: 1.06,
        rotateY: 0,
        rotateZ: 0,
        zIndex: 30,
        opacity: 1,
        filter: 'brightness(1) blur(0px)',
        boxShadow: '0 26px 60px -10px rgba(0, 0, 0, 0.45), 0 0 32px rgba(249, 115, 22, 0.22)',
      }
    }

    if (diff === -1) {
      return {
        x: -offsetDistance,
        y: 4,
        scale: 0.84,
        rotateY: isMobile ? 14 : 20,
        rotateZ: -1.5,
        zIndex: 15,
        opacity: 0.82,
        filter: 'brightness(0.78) blur(0.4px)',
        boxShadow: '0 14px 34px -8px rgba(0, 0, 0, 0.35)',
      }
    }

    if (diff === 1) {
      return {
        x: offsetDistance,
        y: 4,
        scale: 0.84,
        rotateY: isMobile ? -14 : -20,
        rotateZ: 1.5,
        zIndex: 15,
        opacity: 0.82,
        filter: 'brightness(0.78) blur(0.4px)',
        boxShadow: '0 14px 34px -8px rgba(0, 0, 0, 0.35)',
      }
    }

    // Queued / offscreen cards
    if (diff < -1) {
      return {
        x: -offsetDistance * 1.8,
        y: 10,
        scale: 0.65,
        rotateY: 30,
        rotateZ: -3,
        zIndex: 5,
        opacity: 0,
        filter: 'brightness(0.5) blur(2px)',
        boxShadow: 'none',
      }
    }

    return {
      x: offsetDistance * 1.8,
      y: 10,
      scale: 0.65,
      rotateY: -30,
      rotateZ: 3,
      zIndex: 5,
      opacity: 0,
      filter: 'brightness(0.5) blur(2px)',
      boxShadow: 'none',
    }
  }

  return (
    <section
      className="section movies-carousel-section"
      id="movies-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="movies-coverflow-container">
        {/* Title Header */}
        <div className="movies-header-elegant">
          <motion.h2
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="movies-title-elegant"
          >
            {activeTab === 'now_showing' ? (
              <>Jelajahi Film <em>Sedang Tayang</em></>
            ) : (
              <>Nantikan Film <em>Segera Tayang</em></>
            )}
          </motion.h2>

          {/* Action Filter Pills (Sedang Tayang & Segera Tayang) */}
          <div className="movies-header-filter-pills">
            <button
              type="button"
              className={`hero-filter-pill${activeTab === 'now_showing' ? ' active' : ''}${clickedPill === 'now_showing' ? ' pill-clicked' : ''}`}
              onClick={() => handlePillClick('now_showing')}
              id="movies-pill-now-showing"
            >
              Sedang Tayang
            </button>
            <button
              type="button"
              className={`hero-filter-pill${activeTab === 'coming_soon' ? ' active' : ''}${clickedPill === 'coming_soon' ? ' pill-clicked' : ''}`}
              onClick={() => handlePillClick('coming_soon')}
              id="movies-pill-coming-soon"
            >
              Segera Tayang
            </button>
          </div>
        </div>

        {/* 3D Coverflow Stage with Motion Physics */}
        <div className="movies-coverflow-stage">
          {filtered.map((movie, index) => {
            const diff = getCardOffset(index)
            const isCenter = diff === 0
            const isVisible = Math.abs(diff) <= 1

            return (
              <motion.div
                key={movie.id}
                className={`movies-coverflow-card ${isCenter ? 'card-center' : diff === -1 ? 'card-left' : diff === 1 ? 'card-right' : 'card-hidden'}`}
                initial={false}
                animate={getMotionAnimation(diff)}
                transition={{
                  type: 'spring',
                  stiffness: 270,
                  damping: 26,
                  mass: 0.85,
                }}
                whileHover={
                  isCenter
                    ? { scale: 1.11, y: -6, transition: { duration: 0.25 } }
                    : isVisible
                    ? { scale: 0.88, filter: 'brightness(0.95)', transition: { duration: 0.25 } }
                    : undefined
                }
                whileTap={{ scale: isCenter ? 1.04 : 0.8 }}
                drag={isCenter ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.22}
                onDragEnd={(_, { offset, velocity }) => {
                  if (offset.x < -45 || velocity.x < -280) {
                    handleNext()
                  } else if (offset.x > 45 || velocity.x > 280) {
                    handlePrev()
                  }
                }}
                onClick={() => handleCardClick(diff, movie.id)}
                id={`movie-coverflow-${movie.id}`}
                role="button"
                tabIndex={isCenter ? 0 : -1}
                aria-label={`${movie.title} - ${isCenter ? 'Sedang Dipilih' : 'Klik untuk memilih'}`}
                style={{
                  pointerEvents: isVisible ? 'auto' : 'none',
                }}
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  loading="lazy"
                  onError={e => {
                    const t = e.target as HTMLImageElement
                    t.style.display = 'none'
                    t.parentElement!.style.background = 'linear-gradient(135deg, #4A2C1A, #E8691A)'
                  }}
                />

                {/* Badge Status Film */}
                <div className={`movie-coverflow-status-badge ${movie.status}`}>
                  <span className="status-dot"></span>
                  {movie.status === 'now_showing' ? 'Sedang Tayang' : 'Segera Tayang'}
                </div>

                {/* Hover Overlay with "Lihat Film" – shows on hover */}
                <div className="movies-card-hover-overlay">
                  <Link
                    to={`/movies/${movie.id}`}
                    className="movies-glass-btn"
                    onClick={e => e.stopPropagation()}
                    id={`movie-btn-lihat-${movie.id}`}
                    tabIndex={-1}
                  >
                    Lihat Film
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Circular Prev & Next Buttons with Framer Motion spring click */}
        <div className="movies-coverflow-nav">
          <motion.button
            type="button"
            className="movies-nav-dot-btn"
            onClick={handlePrev}
            whileHover={{ scale: 1.18, backgroundColor: '#ffffff', color: '#fe7425' }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            aria-label="Film Sebelumnya"
            title="Film Sebelumnya"
            id="movies-btn-prev"
          >
            ‹
          </motion.button>
          <motion.button
            type="button"
            className="movies-nav-dot-btn"
            onClick={handleNext}
            whileHover={{ scale: 1.18, backgroundColor: '#ffffff', color: '#fe7425' }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            aria-label="Film Berikutnya"
            title="Film Berikutnya"
            id="movies-btn-next"
          >
            ›
          </motion.button>
        </div>
      </div>
    </section>
  )
}
