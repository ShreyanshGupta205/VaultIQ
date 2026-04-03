import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid Credentials' }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid Credentials' }, { status: 400 });
        }

        const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: '7d' });
        
        return NextResponse.json({ 
            token, 
            user: { id: user.id, email: user.email, name: user.name } 
        }, { status: 200 });

    } catch (err: any) {
        console.error(err.message);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
