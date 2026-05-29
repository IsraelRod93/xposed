import { Metadata, ResolvingMetadata } from 'next';
import PublicSender from '@/components/PublicSender/PublicSender';

type Props = {
  params: Promise<{ link: string }>;
};

async function getReceiver(link: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/user/by-link/${link}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Error fetching receiver for metadata:", e);
  }
  return null;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { link } = await params;
  const receiver = await getReceiver(link);
  
  const name = receiver?.display_name || (receiver?.username ? `@${receiver.username}` : 'Alguien');

  return {
    title: `Xposed | Mensaje anónimo para ${name}`,
    description: `Dime lo que piensas de mí en secreto. No sabré quién eres. 🤫`,
    openGraph: {
      title: `Xposed | ${name}`,
      description: `Envíame un secreto anónimo. Atrévete. 🚀`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { link } = await params;
  const receiver = await getReceiver(link);

  return <PublicSender initialReceiver={receiver} />;
}
