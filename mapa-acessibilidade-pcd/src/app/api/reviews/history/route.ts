import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { userEmail: session.user.email },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Erro ao buscar histórico de reviews:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
