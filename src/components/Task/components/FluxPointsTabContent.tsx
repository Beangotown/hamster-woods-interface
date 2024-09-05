import { useIsMobile } from 'redux/selector/mobile';
import styles from './style.module.css';
import { TPointItem } from '../hook/socketPoints';
import NoData from 'components/NoData';

type FluxPointsTabContentProps = {
  pointsList: TPointItem[];
};

export const FluxPointsTabContent = ({ pointsList }: FluxPointsTabContentProps) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={`w-full h-full flex-col justify-start items-start inline-flex ${
        isMobile ? 'py-[16px]' : 'py-[24px]'
      } overflow-hidden`}>
      {/* header */}
      <div className="self-stretch h-9 px-4 py-[10px] bg-[#DEC49D] rounded-md flex flex-col justify-between items-start">
        <div className="self-stretch flex justify-start items-start gap-4 inline-flex">
          <div
            className={`${
              isMobile ? 'text-[12px]' : 'text-[16px]'
            } flex-1 text-[#AE694C] font-roboto font-normal leading-4 break-words`}>
            Task
          </div>
          <div
            className={`${
              isMobile ? 'text-[12px]' : 'text-[16px]'
            } w-50 text-[#AE694C] font-roboto font-normal leading-4 break-words`}>
            Point
          </div>
          <div
            className={`${
              isMobile ? 'text-[12px]' : 'text-[16px]'
            } w-50 text-[#AE694C] font-roboto font-normal leading-4 break-words`}>
            Mining Rewards
          </div>
        </div>
      </div>
      {/* item  */}
      <div className={`${styles.scrollbar} h-full w-full overflow-y-auto overflow-hidden`}>
        {pointsList && pointsList.length > 0 ? (
          pointsList?.map((item, index) => (
            <div
              key={index}
              className={`${
                isMobile ? 'px-2' : 'px-4'
              } self-stretch py-3 border-b border-[#D3B68A] flex justify-start items-center gap-4 inline-flex w-full`}>
              <div
                className={`${
                  isMobile ? 'text-[12px]' : 'text-[16px]'
                } flex-1 text-[#953D22] font-roboto font-normal leading-4 break-words`}>
                {item?.behavior ?? '--'}
              </div>
              <div
                className={`${
                  isMobile ? 'text-[12px]' : 'text-[16px]'
                } w-50 text-[#953D22] font-roboto font-normal leading-4 break-words`}>
                {`${item?.pointAmount ?? '0'} ${item?.pointName ?? '--'}`}
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center h-full">
            <NoData />
          </div>
        )}
      </div>
    </div>
  );
};
