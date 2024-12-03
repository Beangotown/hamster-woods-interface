import Image from 'next/image';
import styles from './style.module.css';
import CommonBtn from 'components/CommonBtn';
import { useState } from 'react';
import useGetState from 'redux/state/useGetState';
import CustomModal from 'components/CustomModal';
export default function Intro() {
  const [rulesVisible, setRulesVisible] = useState(false);
  const { isMobile, configInfo } = useGetState();

  return (
    <>
      <Image
        src={require('assets/images/header-intro.png')}
        alt=""
        className={`${isMobile ? styles.intro : styles['intro-pc']}`}
        onClick={() => setRulesVisible(true)}
      />
      <CustomModal
        open={rulesVisible}
        title="Game Rules"
        centered={true}
        onCancel={() => {
          setRulesVisible(false);
        }}
        className={`${styles.rulesModal} ${isMobile && styles.mobileRulesModal}`}>
        <div className={`flex flex-col ${isMobile ? 'max-h-[50vh] h-[20rem]' : 'h-[550px]'}`}>
          <div
            className={`flex-1 overflow-auto text-left text-base leading-6   md:text-[24px] md:leading-[32px] w-full ${
              isMobile ? 'text-base leading-6 px-[16px]' : styles.content
            }`}>
            {configInfo?.gameRules.map((item, index) => {
              return (
                <p key={index} className="mb-[12px]">
                  {item}
                </p>
              );
            })}
          </div>
          <CommonBtn
            title="I know"
            className={`font-fonarto flex items-center justify-center ${
              isMobile
                ? 'mt-[24px] !text-[20px] !leading-[20px] mx-[16px]'
                : 'mt-[40px] mx-[64px] !text-[32px] !leading-[40px] !h-[76px]  px-[32px]'
            }`}
            onClick={() => {
              setRulesVisible(false);
            }}></CommonBtn>
        </div>
      </CustomModal>
    </>
  );
}
