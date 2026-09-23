import React from 'react';
import Marquee from 'react-fast-marquee';
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss } from 'react-icons/si';

const techLogos = [
  { node: <SiReact className="w-8 h-8" />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs className="w-8 h-8" />, title: "Next.js", href: "https://nextjs.org" },
  { node: <SiTypescript className="w-8 h-8" />, title: "TypeScript", href: "https://www.typescriptlang.org" },
  { node: <SiTailwindcss className="w-8 h-8" />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
];

export const LogoLoop: React.FC = () => {
  return (
    <div className="w-full py-6 bg-white border-t-[2.5px] border-b-[2.5px] border-black overflow-hidden">
      <Marquee speed={50} gradient={false}>
        {techLogos.map((logo, index) => (
          <a
            key={index}
            href={logo.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mx-8 text-black hover:text-[#6B21A8] transition-colors"
          >
            {logo.node}
            <span className="font-mono font-bold text-sm uppercase">{logo.title}</span>
          </a>
        ))}
      </Marquee>
    </div>
  );
};
