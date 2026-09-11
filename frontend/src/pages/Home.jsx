import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake, MapPinned, Search, ShieldCheck } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import homePairImage from '../assets/editorial/home-pair.webp'
import homeStoryImage from '../assets/editorial/home-story.webp'
import PetCard from '../components/PetCard.jsx'
import { listPets } from '../services/petService.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

gsap.registerPlugin(ScrollTrigger)

function Home() {
  const homeRef = useRef(null)
  const [recentPets, setRecentPets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadRecentPets() {
      try {
        setIsLoading(true)
        setError('')
        const pets = await listPets({ status: 'P' })
        setRecentPets(pets.slice(0, 3))
      } catch (err) {
        setError(getApiErrorMessage(err, 'Nao foi possivel carregar os pets recentes.'))
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecentPets()
  }, [])

  useEffect(() => {
    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduceMotion) {
        return
      }

      gsap.fromTo(
        '.home-hero-content > *',
        { opacity: 0, transform: 'translateY(12px)' },
        {
          duration: 0.52,
          ease: 'power3.out',
          opacity: 1,
          stagger: 0.07,
          transform: 'translateY(0)',
        },
      )

      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, transform: 'translateY(12px)' },
          {
            duration: 0.46,
            ease: 'power3.out',
            opacity: 1,
            scrollTrigger: {
              once: true,
              start: 'top 84%',
              trigger: element,
            },
            transform: 'translateY(0)',
          },
        )
      })

      gsap.fromTo(
        '.home-story-image img',
        { opacity: 0.78, transform: 'scale(0.97)' },
        {
          ease: 'none',
          opacity: 1,
          scrollTrigger: {
            end: 'center center',
            scrub: true,
            start: 'top bottom',
            trigger: '.home-story-image',
          },
          transform: 'scale(1)',
        },
      )

    }, homeRef)

    return () => {
      context.revert()
    }
  }, [])

  return (
    <div className="home-page" ref={homeRef}>
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>Uma pista perto de você pode mudar o caminho de volta.</h1>
          <p>
            Cadastre, procure e compartilhe informações com quem já está olhando
            pelo mesmo bairro.
          </p>
          <div className="home-actions">
            <Link className="primary-action" to="/cadastrar-pet">
              Cadastrar um pet
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className="hero-text-link" to="/pets">
              Procurar pets perdidos
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>
        <figure className="home-hero-media">
          <img
            alt="Cachorro e gato juntos ao ar livre"
            fetchPriority="high"
            height="1600"
            src={homePairImage}
            width="1200"
          />
          <figcaption className="home-hero-note">
            <span className="status-dot" />
            Uma coleira, uma mancha no pelo ou o horário de um avistamento podem
            aproximar a busca.
          </figcaption>
        </figure>
      </section>

      <section className="home-signal-row" aria-label="Como a rede ajuda">
        <div className="signal-item signal-map">
          <MapPinned aria-hidden="true" size={25} />
          <div>
            <strong>Olhe para o bairro certo</strong>
            <span>Mapa aproximado para proteger cada familia sem esconder o caminho.</span>
          </div>
        </div>
        <div className="signal-item signal-search">
          <Search aria-hidden="true" size={22} />
          <div>
            <strong>Procure por perto</strong>
            <span>Filtros que fazem sentido para a sua cidade.</span>
          </div>
        </div>
        <div className="signal-item signal-hand">
          <HeartHandshake aria-hidden="true" size={22} />
          <div>
            <strong>Deixe uma pista</strong>
            <span>Um avistamento pode mudar o dia de alguem.</span>
          </div>
        </div>
        <div className="signal-item signal-privacy">
          <ShieldCheck aria-hidden="true" size={22} />
          <div>
            <strong>Ajude com cuidado</strong>
            <span>Informacao util, contato opcional e privacidade por padrao.</span>
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="home-marquee">
        <div className="home-marquee-track">
          <span>observar</span>
          <i>+</i>
          <span>registrar</span>
          <i>+</i>
          <span>compartilhar</span>
          <i>+</i>
          <span>aproximar</span>
          <i>+</i>
          <span>observar</span>
          <i>+</i>
          <span>registrar</span>
          <i>+</i>
          <span>compartilhar</span>
          <i>+</i>
          <span>aproximar</span>
          <i>+</i>
        </div>
      </div>

      <section className="home-section home-recent" data-reveal>
        <div className="section-heading">
          <div>
            <h2>Quem esta esperando por uma boa noticia</h2>
          </div>
          <Link className="section-link" to="/pets">
            Ver todos
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        {isLoading ? (
          <p className="feedback">Carregando pets recentes...</p>
        ) : error ? (
          <p className="feedback error">{error}</p>
        ) : recentPets.length > 0 ? (
          <div className="pet-list compact">
            {recentPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <p className="feedback">Nenhum pet perdido cadastrado por enquanto.</p>
        )}
      </section>

      <section className="home-story">
        <div className="home-story-copy" data-reveal>
          <h2>Uma foto. Um bairro. Um reencontro.</h2>
          <p>
            A foto ajuda a reconhecer. O bairro ajuda a saber onde olhar. Quando
            essas informacoes se encontram, uma pista deixa de ser apenas
            coincidencia.
          </p>
          <div className="story-proof">
            <ShieldCheck aria-hidden="true" size={20} />
            <span>Localizacao aproximada. Informacao cuidadosa.</span>
          </div>
        </div>
        <div className="home-story-image">
          <img
            alt="Tutora abracando seu cachorro em uma area externa"
            decoding="async"
            height="720"
            loading="lazy"
            src={homeStoryImage}
            width="960"
          />
          <span>Uma imagem nitida ajuda alguem a reconhecer</span>
        </div>
      </section>

      <section className="home-final-cta" data-reveal>
        <h2>Uma pista pequena pode levar a um reencontro enorme.</h2>
        <Link className="secondary-action" to="/criar-conta">
          Fazer parte da rede
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </section>
    </div>
  )
}

export default Home
