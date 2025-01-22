import Leaderboard from 'components/Leaderboard';

import PageLoading from 'components/PageLoading';
import GameRecord from 'components/GameRecord';
import Task from 'components/Task';
export interface IGlobalCom {
  getChance?: () => void;
}
export default function GlobalCom(props: IGlobalCom) {
  const { getChance } = props;
  return (
    <>
      <Leaderboard />
      <GameRecord />
      <PageLoading />
      <Task getChance={getChance} />
    </>
  );
}
