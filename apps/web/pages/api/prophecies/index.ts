import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@countdown3d/database';
import type { Prophecy } from '@countdown3d/database/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { title, description, date, status, source, tags, metadata } = req.body;
      
      const prophecy = await prisma.prophecy.create({
        data: {
          title,
          description,
          date: new Date(date),
          status,
          source,
          tags,
          metadata
        }
      });

      return res.status(200).json(prophecy);
    } catch (error) {
      console.error('Error creating prophecy:', error);
      return res.status(500).json({ error: 'Failed to create prophecy' });
    }
  } else if (req.method === 'GET') {
    try {
      const { status, tag } = req.query;
      
      const where = {
        ...(status && { status: String(status) }),
        ...(tag && { tags: { has: String(tag) } })
      };

      const prophecies = await prisma.prophecy.findMany({
        where,
        orderBy: {
          date: 'asc'
        }
      });

      return res.status(200).json(prophecies);
    } catch (error) {
      console.error('Error fetching prophecies:', error);
      return res.status(500).json({ error: 'Failed to fetch prophecies' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 