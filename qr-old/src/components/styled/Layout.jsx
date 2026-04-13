import styled from 'styled-components';
import footer from '../../assest/footer@2x.png';
import usdcIcon from '../../assest/USDC@2x.png'
import solanaIcon from '../../assest/Solana@2x.png'
export const AppContainer = styled.div`
    width: 100%;
    min-height: calc(100vh - 128px);
    @media (max-width: 480px) {
        min-height: calc(100vh);
    }
`;

export const HeaderBar = styled.header`
    height: 128px;
    @media (max-width: 480px) {
        height: 88px;
        display: none;
    }
`;

export const HeaderInner = styled.div`
   width: 100%;
   height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    @media (max-width: 480px) {
        padding: 0 12px;
    }
`;

export const LogoImg = styled.img`
   width: 104px;
   height: 48px;
   @media (max-width: 480px) {
        width: 84px;
        height: 38px;
   }
`;
export const CardWraper = styled.div`
    width: 1200px;
    min-height: calc(100vh - 128px);
   
   display: flex;
   flex-direction: column;
   justify-content: space-between;
   margin: 0 auto;
    background: #101213;
    border-radius: 16px 16px 0px 0px;
    border: 1px solid #585858;
    border-bottom: none;
    @media (max-width: 480px) {
        width: 100%;
        border-left: none;
        border-right: none;
        background: none;
        padding: 134px 40px 0 40px;
        min-height: calc(100vh);

        &.connectCardWraper{
            padding: 0;
            min-height: calc(100vh);
            
        }
    }
`;
export const Card = styled.div`
    &.noConnectCard {
        padding-top: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        .icon1{
            width: 80px;
            height: 80px;
        }
        .noConnectCardText{
            font-family: PingFangSC, PingFang SC;
            font-weight: 400;
            font-size: 16px;
            color: #A0AEC0;
            line-height: 24px;
            margin: 40px 0 80px;
            text-align: center;
        }
        @media (max-width: 480px) {
            padding-top: 0px;
            .noConnectCardText { font-size: 14px; line-height: 20px; margin: 40px 0 150px; }
        }
    }
    &.connectCard {
        padding: 32px ;
        @media (max-width: 480px) {
            padding: 16px 12px;
        }
    }
    &.addressQRCard{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px 0;
        border-bottom: 1px solid rgba(220, 220, 220, .2);
        .addressQR{
            padding: 10px;
            background: #fff;
            border-radius: 10px;
        }
        @media (max-width: 480px) {
            .addressQR { padding: 8px; }
        }
    }

`;

export const CardTitle = styled.h3`
    margin: 0 0 12px 0;
    font-size: 18px;
    @media (max-width: 480px) {
        font-size: 16px;
        margin-bottom: 10px;
    }
`;
export const CardActiveDom = styled.div`
    padding-top: 30px;
    .activityListContent{
        min-height: 400px;
        @media (max-width: 480px) {
            min-height: 300px;
        }
    }
`;
export const CardSectionTitle = styled.div`
  font-family: PingFangSC, PingFang SC;
font-weight: 500;
font-size: 18px;
color: #FFFFFF;
line-height: 18px;
`;

export const CardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;
export const ActivityDom = styled.div`
    border-bottom: 1px solid rgba(220, 220, 220, .2);
    
`;
export const ActivityRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    @media (max-width: 480px) {
        padding: 8px 0;
    }
`;

export const ActivityLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    .img{
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: url(${usdcIcon}) no-repeat center center;
        background-size: 100% 100%;
        position: relative;
        .icon{
            width: 16px;
            height: 16px;
            background: url(${solanaIcon}) no-repeat center center;
            background-size: 100% 100%;
            position: absolute;
            right: 0;
            bottom: 0;
        }
    }
    .activityLeftText{
        .activityLeftTextTitle{
            font-family: PingFangSC, PingFang SC;
            font-weight: 500;
            font-size: 20px;
            color: #FFFFFF;
            line-height: 20px;
            margin-bottom: 8px;
        }
        .activityLeftTextSubTitle{
            font-family: PingFangSC, PingFang SC;
            font-weight: 500;
            font-size: 16px;
            color: #1EBE30;
            line-height: 16px;
        }
    }
    @media (max-width: 480px) {
        gap: 10px;
        .activityLeftText{
        .activityLeftTextTitle{
            font-family: PingFangSC, PingFang SC;
            font-weight: 500;
            font-size: 16px;
            color: #FFFFFF;
            line-height: 20px;
            margin-bottom: 8px;
        }
        .activityLeftTextSubTitle{
            font-family: PingFangSC, PingFang SC;
            font-weight: 500;
            font-size: 16px;
            color: #1EBE30;
            line-height: 16px;
        }
    }
    }
`;

export const ActivityRight = styled.div`
text-align: right;
   .activityRightText{
font-family: PingFangSC, PingFang SC;
font-weight: 500;
font-size: 20px;
color: #FFFFFF;
line-height: 20px;
margin-bottom: 4px;
   }
   .activityRightTextFiat{
font-family: PingFangSC, PingFang SC;
font-weight: 500;
font-size: 16px;
color: #A0AEC0;
line-height: 16px;
   }
   @media (max-width: 480px) {
    .activityRightText{
        font-size: 16px;
        line-height: 16px;
        margin-bottom: 4px;
    }
    .activityRightTextFiat{
        font-size: 14px;
        line-height: 14px;
    }
   }
`;

export const Pagination = styled.div`
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    padding-top: 12px;
    flex-wrap: wrap;
    @media (max-width: 480px) {
        gap: 6px;
        padding-top: 16px;
    }
`;

export const PageBtn = styled.button`
    background: #0f0f15;
    color: #eaeaf0;
    border: 1px solid #242433;
    border-radius: 8px;
    padding: 6px 12px;
    min-width: 36px;
    height: 36px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 400;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover:not(:disabled):not(.active) {
        background: #1a1a1a;
        border-color: #333;
    }
    
    &.active {
        background: #FFFFFF;
        color: #000000;
        border-color: #FFFFFF;
        font-weight: 500;
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        border-style: dashed;
    }
    
    &.ellipsis {
        cursor: default;
        border: none;
        background: transparent;
        min-width: auto;
        padding: 0;
        &:hover {
            background: transparent;
        }
    }
    
    @media (max-width: 480px) {
        padding: 6px 10px;
        min-width: 32px;
        height: 32px;
        font-size: 13px;
        border-radius: 6px;
        
        &.ellipsis {
            padding: 0 4px;
        }
    }
`;

export const Row = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

export const Label = styled.div`
    color: #9ea3b0;
    font-size: 12px;
`;

export const Value = styled.div`
text-align: center;
    font-family: PingFangSC, PingFang SC;
font-weight: 500;
font-size: 18px;
color: #DBDBDB;
line-height: 36px;
    word-break: break-all;
   padding-top: 24px;
   
    @media (max-width: 480px) {
        font-size: 14px;
        line-height: 16px;
        padding-top: 16px;
        width: 262px;
        margin: 0 auto;
    }
`;

export const CopyIcon = styled.img`
    width: 16px;
    height: 16px;
    cursor: pointer;
    margin-left: 4px;
    position: relative;
    top: 2px;
`;
export const PrimaryButton = styled.button`
    background: #7c4dff;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    cursor: pointer;
    transition: transform .02s ease;
    &:active { transform: translateY(1px); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const Input = styled.input`
    width: 100%;
    background: #0f0f15;
    color: #eaeaf0;
    border: 1px solid #242433;
    border-radius: 8px;
    padding: 10px 12px;
    outline: none;
    font-size: 14px;
`;

export const Helper = styled.div`
    color: #8b90a2;
    font-size: 12px;
    margin-top: 6px;
`;


export const FooterDom = styled.div`
height: 44px;
display: flex;
justify-content: center;
`;
export const FooterImg = styled.div`
  width: 185px;
  height: 20px;
  background: url(${footer}) no-repeat center center;
  background-size: 100% 100%;
`;

// 骨架屏样式
export const SkeletonBox = styled.div`
    background: linear-gradient(90deg, #1a1a1a 25%, #242433 50%, #1a1a1a 75%);
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
    border-radius: 4px;
    
    @keyframes loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
`;

export const SkeletonOrderHeader = styled(SkeletonBox)`
    height: 16px;
    width: 100%;
    margin-bottom: 8px;
`;

export const SkeletonOrderId = styled(SkeletonBox)`
    height: 12px;
    width: 120px;
    
    @media (max-width: 480px) {
        height: 12px;
        width: 100px;
    }
`;

export const SkeletonDate = styled(SkeletonBox)`
    height: 12px;
    width: 140px;
    
    @media (max-width: 480px) {
        height: 12px;
        width: 120px;
    }
`;

export const SkeletonIcon = styled(SkeletonBox)`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    
    @media (max-width: 480px) {
        width: 40px;
        height: 40px;
    }
`;

export const SkeletonText = styled(SkeletonBox).withConfig({
    shouldForwardProp: (prop) => !['height', 'width', 'marginBottom', 'mobileHeight', 'mobileWidth'].includes(prop),
})`
    height: ${props => props.height || '16px'};
    width: ${props => props.width || '100px'};
    margin-bottom: ${props => props.marginBottom || '0'};
    
    @media (max-width: 480px) {
        height: ${props => props.mobileHeight || props.height || '16px'};
        width: ${props => props.mobileWidth || props.width || '100px'};
    }
`;

export const SkeletonRow = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 0;
    
    @media (max-width: 480px) {
        gap: 10px;
        padding: 8px 0;
    }
`;

export const SkeletonLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    
    @media (max-width: 480px) {
        gap: 10px;
    }
`;

export const SkeletonRight = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
`;

export const SkeletonOrderItem = styled.div`
    padding: 12px 0;
    
    @media (max-width: 480px) {
        padding: 8px 0;
    }
`;