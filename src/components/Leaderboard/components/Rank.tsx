import { useIsMobile } from 'redux/selector/mobile';
import { useConditionalRank } from '../hooks/useConditionalRank';
import { MAX_LEADERBOARD_ITEMS } from 'constants/platform';

interface IRank {
  rank?: number;
}
export const Rank = ({ rank }: IRank) => {
  const isMobile = useIsMobile();

  const textClassName = `bg-[#DEC49D] text-center font-paytone font-bold ${
    isMobile ? 'mx-1 px-3 rounded-full text-md' : 'mx-3 py-1 px-4 rounded-full text-lg'
  }`;

  const wrapperClassName = useConditionalRank({
    rank,
    first: '',
    second: '',
    third: '',
    ranked: `text-[#9A531F] ${textClassName}`,
    unranked: `text-[#9A531F] ${textClassName}`,
    missing: `text-[#9A531F] text-neutral-400 ${textClassName}`,
  });

  const imgClassName = `w-[40px] h-[40px]`;

  const el = useConditionalRank({
    rank,
    first: <img src={require('assets/images/gold.png').default.src} alt="gold" className={imgClassName} />,
    second: <img src={require('assets/images/silver.png').default.src} alt="silver" className={imgClassName} />,
    third: <img src={require('assets/images/bronze.png').default.src} alt="bronze" className={imgClassName} />,
    ranked: rank,
    unranked: `${MAX_LEADERBOARD_ITEMS}+`,
    missing: <>&mdash;</>,
  });

  return <div className={`${wrapperClassName}`}>{el}</div>;
};
