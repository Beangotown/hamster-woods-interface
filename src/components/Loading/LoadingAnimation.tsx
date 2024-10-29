import { TelegramPlatform } from '@portkey/did-ui-react';
import GameComing from 'assets/images/game-coming.png';
import LoadingAnimationJson from 'assets/images/loading-animation.json';
import { useLottie } from 'lottie-react';
import useGetState from 'redux/state/useGetState';

export default function LoadingAnimation() {
  const { isMobile } = useGetState();

  const Animation = () => {
    const options = {
      animationData: LoadingAnimationJson,
      loop: true,
      autoplay: true,
    };

    const { View } = useLottie(options, { margin: '0 auto', width: isMobile ? '110px' : '148px' });

    return View;
  };

  return (
    <div
      style={{
        backgroundImage: `url(${
          require(isMobile ? 'assets/images/bg/game-bg-mobile.png' : 'assets/images/bg/game-bg-pc.png').default.src
        })`,
      }}
      className={`h-full w-full overflow-hidden bg-cover ${
        TelegramPlatform.isTelegramPlatform() ? 'pt-[18px]' : isMobile ? 'pt-[440px]' : 'pt-[7vh]'
      }`}>
      {isMobile ? null : (
        <img
          src={require('assets/images/bg/hamster-logo.png').default.src}
          width={isMobile ? 240 : 480}
          alt="logo"
          className={`mx-auto ${isMobile ? 'h-[240px] w-[240px]' : 'h-[480px] w-[480px]'}`}></img>
      )}
      <img
        width={isMobile ? 285 : 480}
        src={GameComing.src}
        alt="coming"
        className={`mx-auto ${isMobile ? 'w-[285px]' : 'w-[480px]'}`}></img>
      <Animation></Animation>
    </div>
  );
}
