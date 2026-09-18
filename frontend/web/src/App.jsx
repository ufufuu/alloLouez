import { useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Car, CheckCircle2, ChevronRight, MapPin, Menu, Search, ShieldCheck, Star, Users, Fuel, Gauge, CalendarDays } from 'lucide-react'

const cars = [
  { id: 1, name: 'Toyota Yaris', type: 'Économique', location: 'Lomé, Togo', price: 25000, image: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=80' },
  { id: 2, name: 'Toyota Corolla', type: 'Compacte', location: 'Lomé, Togo', price: 35000, image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=900&q=80' },
  { id: 3, name: 'Toyota Hilux', type: '4x4', location: 'Lomé, Togo', price: 55000, image: 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=900&q=80' },
  { id: 4, name: 'Hyundai Tucson', type: 'SUV', location: 'Lomé, Togo', price: 50000, image: 'https://images.unsplash.com/photo-1625231334168-35067f8853e9?auto=format&fit=crop&w=900&q=80' },
]

function Header() {
  return <header>
    <Link className="logo" to="/">Allo<span>Louez</span></Link>
    <nav><Link to="/cars">Louer une voiture</Link><a href="#locations">Destinations</a><a href="#how">Comment ça marche</a></nav>
    <button className="language">FR</button><Link className="link" to="/cars">Rechercher</Link><button className="menu"><Menu /></button>
  </header>
}

function SearchBox() {
  const navigate = useNavigate()
  const [city, setCity] = useState('Lomé')
  return <div className="searchbox">
    <div className="search-title"><b>Trouvez votre voiture</b><small>Comparez les véhicules disponibles près de votre destination.</small></div>
    <div className="field"><MapPin size={18}/><label>Lieu de prise en charge<select value={city} onChange={e => setCity(e.target.value)}><option>Lomé</option><option>Accra</option><option>Cotonou</option><option>Abidjan</option></select></label></div>
    <div className="field"><CalendarDays size={18}/><label>Date de départ<input type="date" /></label></div>
    <div className="field"><CalendarDays size={18}/><label>Date de retour<input type="date" /></label></div>
    <div className="field"><Car size={18}/><label>Type de véhicule<select><option>Tous les véhicules</option><option>Économique</option><option>SUV</option><option>4x4</option></select></label></div>
    <button className="search" onClick={() => navigate('/cars')}><Search size={18}/> Rechercher une voiture</button>
    <div className="search-note">Recherche simple · réservation en ligne · assistance locale</div>
  </div>
}

function CarCard({ car }) {
  return <article className="card">
    <div className="carimage"><img src={car.image} alt={car.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/><span className="badge">Disponible</span></div>
    <div className="cardbody"><div className="rating"><Star size={14} fill="currentColor"/> 4.8</div><h3>{car.name}</h3><div className="specs"><Users size={14}/> 5 places · <Fuel size={14}/> Essence</div><div className="location"><MapPin size={14}/> {car.location}</div><div className="price"><div><b>{car.price.toLocaleString('fr-FR')} FCFA</b><small>/ jour</small></div><Link className="link" to={`/cars/${car.id}`}>Voir <ChevronRight size={15}/></Link></div></div>
  </article>
}

function Home() {
  return <><Header/><main>
    <section className="hero"><div className="hero-copy"><div className="eyebrow">LOCATION DE VOITURES EN AFRIQUE DE L'OUEST</div><h1>Votre voiture,<br/><span>où que vous soyez.</span></h1><p className="sub">Trouvez et réservez facilement une voiture auprès de partenaires locaux. Une expérience simple, transparente et adaptée à l'Afrique.</p><div className="hero-points"><span><CheckCircle2 size={17}/> Prix transparents</span><span><ShieldCheck size={17}/> Partenaires vérifiés</span></div></div><SearchBox/></section>
    <section className="trust"><div><ShieldCheck size={25}/><b>Partenaires vérifiés</b><small>Des professionnels locaux</small></div><div><CheckCircle2 size={25}/><b>Réservation simple</b><small>En quelques étapes</small></div><div><MapPin size={25}/><b>Destinations locales</b><small>Commencez près de vous</small></div><div><Users size={25}/><b>Assistance</b><small>Une équipe à votre écoute</small></div></section>
    <section className="section"><div className="sectionhead"><div><div className="eyebrow">NOTRE SÉLECTION</div><h2>Véhicules populaires</h2></div><Link className="link" to="/cars">Voir tous les véhicules <ChevronRight size={16}/></Link></div><div className="grid">{cars.map(car => <CarCard key={car.id} car={car}/>)}</div></section>
    <section className="how" id="how"><div className="eyebrow">SIMPLE ET RAPIDE</div><h2>Comment ça marche ?</h2><div className="steps"><div><span>1</span><h3>Recherchez</h3><p>Choisissez votre ville, vos dates et le type de véhicule.</p></div><div><span>2</span><h3>Comparez</h3><p>Consultez les voitures, prix, caractéristiques et disponibilités.</p></div><div><span>3</span><h3>Réservez</h3><p>Envoyez votre demande et préparez votre trajet en toute simplicité.</p></div></div></section>
    <section className="locations" id="locations"><div><div className="eyebrow">DESTINATIONS</div><h2>Louez dans votre ville</h2><p>AlloLouez est conçu pour connecter les voyageurs aux véhicules disponibles dans les villes d'Afrique de l'Ouest.</p></div><div className="city-grid"><button><MapPin size={18}/> Lomé <ChevronRight size={16}/></button><button><MapPin size={18}/> Accra <ChevronRight size={16}/></button><button><MapPin size={18}/> Cotonou <ChevronRight size={16}/></button><button><MapPin size={18}/> Abidjan <ChevronRight size={16}/></button></div></section>
  </main><footer><Link className="logo" to="/">Allo<span>Louez</span></Link><span>Location de voitures en Afrique de l'Ouest</span><span>© 2026 AlloLouez</span></footer></>
}

function Cars() { return <><Header/><main className="results-page"><div className="results-top"><div><div className="eyebrow">RÉSULTATS</div><h1>Voitures disponibles</h1><p>Découvrez les véhicules proposés à Lomé.</p></div><Link className="back" to="/">← Modifier la recherche</Link></div><div className="modify"><div className="mini-field"><MapPin size={16}/><input value="Lomé" readOnly/></div><div className="mini-field"><CalendarDays size={16}/><input type="date"/></div><div className="mini-field"><CalendarDays size={16}/><input type="date"/></div><button className="search">Rechercher</button></div><div className="results-layout"><aside><b>Filtrer</b><label>TYPE</label><button className="filter active">Tous</button><button className="filter">Économique</button><button className="filter">SUV</button><button className="filter">4x4</button><label>TRIER</label><select className="sort"><option>Prix croissant</option><option>Prix décroissant</option></select></aside><div className="result-list">{cars.map(car => <CarCard key={car.id} car={car}/>)}</div></div></main></> }

function Details({ id }) { const car = cars.find(c => c.id === Number(id)) || cars[0]; return <><Header/><main className="details-page"><Link className="back" to="/cars">← Retour aux véhicules</Link><div className="detail-grid"><div><div className="detail-image"><img src={car.image} alt={car.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:16}}/></div><div className="detail-title"><div className="rating"><Star size={14} fill="currentColor"/> 4.8 · Partenaire vérifié</div><h1>{car.name}</h1><p><MapPin size={16}/> {car.location} · {car.type}</p></div><div className="detail-box"><h2>Caractéristiques</h2><div className="detail-specs"><span><Users size={18}/> 5 passagers</span><span><Gauge size={18}/> Automatique</span><span><Fuel size={18}/> Essence</span><span><Car size={18}/> Climatisation</span></div></div></div><aside className="detail-box booking-card"><h2>Réserver ce véhicule</h2><div className="booking-summary"><div><span>Prix par jour</span><b>{car.price.toLocaleString('fr-FR')} FCFA</b></div><div><span>Durée</span><b>À sélectionner</b></div><div className="total"><span>Total estimé</span><b>—</b></div></div><label>Nom<input placeholder="Votre nom"/></label><label>Téléphone<input placeholder="+228 ..."/></label><label>Message<textarea placeholder="Informations complémentaires"/></label><button className="book">Demander une réservation</button><div className="secure"><ShieldCheck size={14}/> Demande sécurisée</div></aside></div></main></> }

function DetailRoute() { const id = window.location.pathname.split('/').pop(); return <Details id={id}/> }
function NotFound() { return <main className="empty"><Search size={32}/><h1>Page introuvable</h1><Link className="link" to="/">Retour à l'accueil</Link></main> }

export default function App() { return <Routes><Route path="/" element={<Home/>}/><Route path="/cars" element={<Cars/>}/><Route path="/cars/:id" element={<DetailRoute/>}/><Route path="*" element={<NotFound/>}/></Routes> }
