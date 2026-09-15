import { HeartHandshake, MapPinned, Search, ShieldCheck } from 'lucide-react'
import aboutImage from '../assets/editorial/about.webp'

function AboutPage() {
  return (
    <section className="content-view about-view">
      <div className="about-hero">
        <div className="about-hero-copy">
          <h1>Uma busca fica mais clara quando a cidade sabe quem procurar.</h1>
          <p>
            O Achar seu Pet nasceu para transformar a aflição de uma busca em uma
            rede de apoio: mais organizada para quem procura, mais simples para
            quem quer ajudar.
          </p>
          <div className="about-signature">
            <HeartHandshake aria-hidden="true" size={22} />
            <span>Ninguém deveria procurar sozinho.</span>
          </div>
        </div>
        <figure className="about-visual">
          <img
            alt="Tutora acolhendo seus dois cachorros em uma rua da cidade"
            decoding="async"
            height="1050"
            loading="lazy"
            src={aboutImage}
            width="1400"
          />
          <figcaption>
            O Lobinha aproxima tutores e pessoas dispostas a prestar atenção no caminho.
          </figcaption>
        </figure>
      </div>

      <div className="about-values">
        <article tabIndex="0">
          <Search aria-hidden="true" size={24} />
          <h2>Procura que aproxima</h2>
          <p>Filtros por cidade, estado e características ajudam a olhar para o lugar certo.</p>
        </article>
        <article tabIndex="0">
          <ShieldCheck aria-hidden="true" size={24} />
          <h2>Cuidado em cada detalhe</h2>
          <p>A localização aparece de forma aproximada para proteger quem está procurando.</p>
        </article>
        <article tabIndex="0">
          <MapPinned aria-hidden="true" size={24} />
          <h2>Pistas que ganham caminho</h2>
          <p>Avistamentos, mapa e histórico deixam a busca mais clara para toda a rede.</p>
        </article>
      </div>

      <blockquote className="about-quote">
        <p>“Às vezes, ajudar é só prestar atenção no caminho e contar o que você viu.”</p>
        <cite>Uma pequena atitude pode devolver uma grande companhia.</cite>
      </blockquote>
    </section>
  )
}

export default AboutPage
