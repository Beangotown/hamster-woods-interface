import Image from 'next/image';
import styles from './style.module.css';
import useGetState from 'redux/state/useGetState';
import { dispatch } from 'redux/store';
import { toggleShowTaskModal } from 'redux/reducer/info';
export default function Task() {
  const { isMobile } = useGetState();

  return (
    <>
      <Image
        src={require('assets/images/header-task.png')}
        alt=""
        className={`${isMobile ? styles.task : styles['task-pc']}`}
        onClick={() => {
          console.log('toggleShowTaskModal');
          dispatch(toggleShowTaskModal());
        }}
      />
    </>
  );
}
