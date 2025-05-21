"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import ReviewModal from "@/components/ReviewModal";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
}) as React.ComponentType<{
  center: { lat: number; lng: number };
  zoom: number;
  onPlaceClick: (placeId: string) => void;
}>;

export default function Home() {
  const { data: session } = useSession();
  const [mapCenter, setMapCenter] = useState({ lat: -23.55052, lng: -46.633308 });
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlaceData, setSelectedPlaceData] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<{ comment: string;
  wheelchair: number;
  bathroom: number;
  entrance: number;
  parking: number;
  auditory: number;
  visual: number;} | null>(null);

  const mapZoom = 14;

  useEffect(() => {
    if (!selectedPlaceId) return;

    // Buscar reviews
    fetch(`/api/reviews?placeId=${selectedPlaceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setReviews(data);
        else setReviews([]);
      })
      .catch(() => setReviews([]));

    // Buscar dados do local
    const service = new google.maps.places.PlacesService(document.createElement("div"));
    service.getDetails({ placeId: selectedPlaceId }, (place, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        place !== null
      ) {
        setSelectedPlaceData({
          name: place.name,
          address: place.formatted_address,
          url: place.url,
        });
      } else {
        setSelectedPlaceData(null);
      }
    });    
  }, [selectedPlaceId]);

  const hasUserReview = session && reviews.some((r) => r.userEmail === session.user?.email);

const openReviewModal = (mode: "new" | "edit") => {
  if (mode === "edit") {
    const userReview = reviews.find((r) => r.userEmail === session?.user?.email);
    if (userReview) {
      setEditingReview({
        comment: userReview.comment || "",
        wheelchair: userReview.wheelchair || 0,
        bathroom: userReview.bathroom || 0,
        entrance: userReview.entrance || 0,
        parking: userReview.parking || 0,
        auditory: userReview.auditory || 0,
        visual: userReview.visual || 0,
      });
    }
  } else {
    setEditingReview(null);
  }
  setModalOpen(true);
};


  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex justify-between items-center bg-white shadow px-6 py-4">
        <img src="/logo-mapapcd.svg" alt="Logo Mapa PCD" className="h-10" />
        {session ? (
          <div className="flex items-center gap-4">
            <img src={session.user?.image || "/profile-placeholder.svg"} alt="Foto" className="w-10 h-10 rounded-full" />
            <p className="font-semibold text-black">{session.user?.name}</p>
            <button onClick={() => signOut()} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => signIn("google")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Login com Google
          </button>
        )}
      </header>

      {/* Filtros e busca */}
      <section className="flex items-center bg-gray-100 shadow px-6 py-3 gap-4">
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  setMapCenter(coords);
                },
                () => alert("Não foi possível obter sua localização.")
              );
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          📍 Usar minha localização
        </button>

        <div className="flex-1 bg-white">
          <input
            type="text"
            placeholder="Buscar local..."
            className="w-full p-2 border rounded placeholder-black"
          />
        </div>

        <select className="p-2 border-gray rounded bg-white text-black">
          <option>Todos</option>
          <option>Banheiro Acessível</option>
          <option>Entrada Adaptada</option>
          <option>Estacionamento PCD</option>
        </select>

        <select className="p-2 border-gray rounded bg-white text-black">
          <option>Nota mínima</option>
          <option>3 estrelas+</option>
          <option>4 estrelas+</option>
        </select>
      </section>

      {/* Conteúdo principal */}
      <main className="flex flex-1 overflow-hidden">
        <section className="w-full h-full bg-gray-200 relative">
          <Map center={mapCenter} zoom={mapZoom} onPlaceClick={setSelectedPlaceId} />

          {selectedPlaceData && (
            <div className="absolute bottom-4 left-4 md:right-4 bg-white bg-opacity-90 backdrop-blur-md p-4 rounded-xl shadow-lg w-[90vw] md:w-[400px] max-h-[60vh] overflow-y-auto z-50">
              <h2 className="text-xl font-bold text-black mb-1">{selectedPlaceData.name}</h2>
              <p className="text-gray-700 mb-1">{selectedPlaceData.address}</p>

              <a
                href={selectedPlaceData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm underline"
              >
                Ver no Google Maps
              </a>
              {reviews.length > 0 ? (
              <div className="mt-3 mb-2 space-y-1 text-black text-sm">
                <p className="font-semibold">Média das avaliações:</p>
                <p>♿ Acesso para cadeirantes: {(reviews.reduce((a, r) => a + (r.rating_wheelchair || 0), 0) / reviews.length).toFixed(1)} ⭐</p>
                <p>🚻 Banheiro acessível: {(reviews.reduce((a, r) => a + (r.rating_bathroom || 0), 0) / reviews.length).toFixed(1)} ⭐</p>
                <p>🚪 Entrada acessível: {(reviews.reduce((a, r) => a + (r.rating_entry || 0), 0) / reviews.length).toFixed(1)} ⭐</p>
                <p>🅿️ Estacionamento PCD: {(reviews.reduce((a, r) => a + (r.rating_parking || 0), 0) / reviews.length).toFixed(1)} ⭐</p>
                <p>👂 Acessibilidade auditiva: {(reviews.reduce((a, r) => a + (r.rating_hearing || 0), 0) / reviews.length).toFixed(1)} ⭐</p>
                <p>👁️ Acessibilidade visual: {(reviews.reduce((a, r) => a + (r.rating_visual || 0), 0) / reviews.length).toFixed(1)} ⭐</p>
                <p className="mt-1 italic text-gray-500">Baseado em {reviews.length} review{reviews.length > 1 ? "s" : ""}</p>
              </div>

              ) : (
                <div className="mt-3 mb-2">
                  <p className="text-gray-600">Sem avaliações ainda.</p>
                </div>
              )}
              {reviews.length > 0 && (
                <div className="space-y-2">
                  {reviews.slice(0, 2).map((review, idx) => (
                    <div key={idx} className="bg-gray-100 rounded p-2">
                      <p className="text-sm text-black font-semibold">{review.userEmail}</p>
                      <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                      <p className="text-xs text-gray-500">Nota: {review.rating}/5</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                {session ? (
                  <button
                    onClick={() => openReviewModal(hasUserReview ? "edit" : "new")}
                    className={`w-full px-4 py-2 rounded text-white ${
                      hasUserReview ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {hasUserReview ? "Editar sua Review" : "Escrever Review"}
                  </button>
                  
                ) : (
                  <p className="text-sm text-gray-500 text-center italic">Faça login para avaliar este local.</p>
                )}
              </div>

                <div className="mt-2">
                <button
                  onClick={() => {
                    setSelectedPlaceId(null);
                    setSelectedPlaceData(null);
                    setReviews([]);
                    setEditingReview(null);
                  }}
                  className="w-full px-4 py-2 rounded border border-gray-400 text-gray-700 hover:bg-gray-200"
                >
                  Fechar janela
                </button>
              </div>

            </div>
            
          )}
        </section>
      </main>

      {modalOpen && selectedPlaceId && (
      <ReviewModal
        placeId={selectedPlaceId}
        placeName={selectedPlaceData?.name || ""}
        placeAddress={selectedPlaceData?.address || ""}
        defaultValues={editingReview || undefined}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetch(`/api/reviews?placeId=${selectedPlaceId}`)
            .then((res) => res.json())
            .then((data) => setReviews(data));
        }}
      />
      )}
    </div>
  );
}
