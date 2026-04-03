import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
            }
        });

        const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: '7d' });
        
        return NextResponse.json({ 
            token, 
            user: { id: user.id, email: user.email, name: user.name } 
        }, { status: 201 });

    } catch (err: any) {
        console.error(err.message);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
