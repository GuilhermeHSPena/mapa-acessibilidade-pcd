"use client";

import { useState } from "react";

export interface ReviewModalProps {
  placeId: string;
  placeName: string;
  placeAddress: string;
  defaultValues?: {
    comment: string;
    wheelchair: number;
    bathroom: number;
    entrance: number;
    parking: number;
    auditory: number;
    visual: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  placeId,
  placeName,
  placeAddress,
  defaultValues,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [comment, setComment] = useState(defaultValues?.comment || "");

  const [wheelchair, setWheelchair] = useState(defaultValues?.wheelchair || 0);
  const [bathroom, setBathroom] = useState(defaultValues?.bathroom || 0);
  const [entrance, setEntrance] = useState(defaultValues?.entrance || 0);
  const [parking, setParking] = useState(defaultValues?.parking || 0);
  const [auditory, setAuditory] = useState(defaultValues?.auditory || 0);
  const [visual, setVisual] = useState(defaultValues?.visual || 0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const scores = [wheelchair, bathroom, entrance, parking, auditory, visual];
    const isValid = scores.every((n) => n >= 0 && n <= 5);

    if (!isValid) {
      setError("Todas as notas devem ser entre 0 e 5.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googlePlaceId: placeId,
          placeName,
          placeAddress,
          comment,
          wheelchair,
          bathroom,
          entrance,
          parking,
          auditory,
          visual,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar avaliação");

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = (
    label: string,
    value: number,
    onChange: (n: number) => void
  ) => (
    <div className="mb-3">
      <label className="block text-black font-medium mb-1">{label}</label>
      <select
        className="w-full p-2 border rounded text-black"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>0 (Não acessível)</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 border border-gray-300 w-full max-w-md border-gray-100 shadow-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold text-black mb-4">
          {defaultValues ? "Editar Review" : "Escrever Review"}
        </h2>

        {renderCategory("♿ Acesso para cadeirantes", wheelchair, setWheelchair)}
        {renderCategory("🚻 Banheiro acessível", bathroom, setBathroom)}
        {renderCategory("🚪 Entrada acessível", entrance, setEntrance)}
        {renderCategory("🅿️ Estacionamento acessível", parking, setParking)}
        {renderCategory("👂 Acessibilidade auditiva", auditory, setAuditory)}
        {renderCategory("👁️ Acessibilidade visual", visual, setVisual)}

        <div className="mb-4">
          <label className="block text-black font-medium mb-1">Comentário</label>
          <textarea
            className="w-full p-2 border rounded text-black"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
