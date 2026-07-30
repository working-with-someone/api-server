import type { Prisma } from '../generated/prisma/client';

export type PublicUser = Prisma.userGetPayload<{
	include: {
		pfp: true;
	};
	omit: {
		encrypted_password: true;
	};
}>;
