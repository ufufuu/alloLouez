import { Routes, Route, Link } from 'react-router-dom'

function Home() {
  return <section><h1>AlloLouez</h1><p>Car rental marketplace</p><Link to="/cars">Browse cars</Link></section>
}

function Cars() {
  return <section><h1>Cars</h1><p>Vehicle listings will appear here.</p></section>
}

function NotFound() {
  return <section><h1>Page not found</h1><Link to="/">Back home</Link></section>
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/cars" element={<Cars />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}
