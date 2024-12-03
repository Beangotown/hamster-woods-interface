'use client';
import CommonBtn from 'components/CommonBtn';
import styles from './style.module.css';
import CustomModal from 'components/CustomModal';
import { useIsMobile } from 'redux/selector/mobile';

interface ILeaderBoardNotStartedModal {
  open: boolean;
  onCancel: () => void;
}

export default function LeaderBoardNotStartedModal({ open, onCancel }: ILeaderBoardNotStartedModal) {
  const isMobile = useIsMobile();
  return (
    <CustomModal open={open} title="Notice" onCancel={onCancel} className={isMobile ? '!w-[358px]' : '!w-[750px]'}>
      <div className="mb-6 md:mb-[37px] md:text-[24px] md:leading-[32px]">
        <p>Leaderboard not available now. Please stay tuned for upcoming challenges.</p>
      </div>
      <div className="mx-2">
        <CommonBtn
          title="Confirm"
          onClick={onCancel}
          className={`${styles.confirmBtn} ${isMobile ? '!text-[20px]' : '!text-[32px]'}`}></CommonBtn>
      </div>
    </CustomModal>
  );
}
