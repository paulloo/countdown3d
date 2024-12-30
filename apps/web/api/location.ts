import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'POST') {
    try {
      const { latitude, longitude } = req.body;
      
      const location = await prisma.location.create({
        data: {
          latitude,
          longitude,
          createdAt: new Date()
        }
      });

      return res.status(200).json(location);
    } catch (error) {
      console.error('Error saving location:', error);
      return res.status(500).json({ error: 'Failed to save location' });
    }
  } else if (req.method === 'GET') {
    try {
      const locations = await prisma.location.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      return res.status(200).json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      return res.status(500).json({ error: 'Failed to fetch locations' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 