'use client';

import styles from '../Login/style.module.css';
import { Modal } from 'antd';

export default function ShutDownModal() {
  return (
    <Modal open={true} className={styles.loginMethodModal} maskClosable={false} closable={false}>
      {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
      <div className="leading-[1.5] text-[#A15A1C]" style={{ fontSize: '18px' }}>
        <div>Hamster Woods is no longer accessible.</div>
        <div>
          Thank you for every hop, every strategy, and every moment you shared with us. Your support made this journey
          unforgettable.
        </div>
        <div>The game has now shut down. We are deeply grateful for your companionship in the forest.</div>
        <div>— The Hamster Woods Team</div>
      </div>
    </Modal>
  );
}
