import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { googlePlaceId, comment, wheelchair, bathroom, entrance, parking, auditory, visual } = await req.json();

  if (!googlePlaceId || typeof comment !== "string") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    // Buscar o usuário
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Atualizar a review
    const updated = await prisma.reviews.updateMany({
      where: {
        user_id: user.id,
        place_id: googlePlaceId,
      },
      data: {
        comment,
        rating_wheelchair: wheelchair,
        rating_bathroom: bathroom,
        rating_entry: entrance,
        rating_parking: parking,
        rating_hearing: auditory,
        rating_visual: visual,
        edited: true,
        updated_at: new Date(),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Review não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao editar review:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

