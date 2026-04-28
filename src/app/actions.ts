'use server'
import * as P from '../prisma'

export async function markApplied(id: string) {
    await P.prisma.status.upsert({
        where: { id },
        create: { id, status: 'applied' },
        update: { status: 'applied' },
    })
}

export async function markHidden(id: string) {
    await P.prisma.status.upsert({
        where: { id },
        create: { id, status: 'hidden' },
        update: { status: 'hidden' },
    })
}
