import Image from 'next/image';
import styles from './style.module.css';
import useGetState from 'redux/state/useGetState';
import { dispatch } from 'redux/store';
import { toggleShowTaskModal } from 'redux/reducer/info';
export default function Task() {
  const { isMobile, isTgInit } = useGetState();

  return (
    <>
      <Image
        src={require(isMobile ? 'assets/images/header-task.png' : 'assets/images/header-task-pc.png')}
        alt=""
        className={`${isMobile ? styles.task : styles['task-pc']}`}
        onClick={() => {
          console.log('toggleShowTaskModal');
          if (isTgInit) return;
          dispatch(toggleShowTaskModal());
        }}
      />
    </>
  );
}
