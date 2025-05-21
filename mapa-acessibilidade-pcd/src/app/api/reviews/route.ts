import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email || !session.user.name) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    googlePlaceId,
    placeName,
    placeAddress,
    comment,
    wheelchair,
    bathroom,
    entrance,
    parking,
    auditory,
    visual,
  } = body;

  if (!googlePlaceId || typeof comment !== "string") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    // Garantir que o usuário existe no banco
    const user = await prisma.users.upsert({
      where: { email: session.user.email },
      update: {
        name: session.user.name,
        image: session.user.image || undefined,
      },
      create: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image || undefined,
      },
    });

    // Criar ou atualizar o local
    await prisma.places.upsert({
      where: { id: googlePlaceId },
      update: {
        name: placeName,
        address: placeAddress,
      },
      create: {
        id: googlePlaceId,
        name: placeName,
        address: placeAddress,
      },
    });

    // Criar ou atualizar a review
    const review = await prisma.reviews.upsert({
      where: {
        user_id_place_id: {
          user_id: user.id,
          place_id: googlePlaceId,
        },
      },
      update: {
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
      create: {
        user_id: user.id,
        place_id: googlePlaceId,
        comment,
        rating_wheelchair: wheelchair,
        rating_bathroom: bathroom,
        rating_entry: entrance,
        rating_parking: parking,
        rating_hearing: auditory,
        rating_visual: visual,
        edited: false,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Erro ao salvar review:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const googlePlaceId = searchParams.get("placeId");

  if (!googlePlaceId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  try {
    const reviews = await prisma.reviews.findMany({
      where: { place_id: googlePlaceId },
      include: {
        users: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Erro ao buscar reviews:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
