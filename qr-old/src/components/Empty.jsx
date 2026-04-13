import React from 'react';
import styled from 'styled-components';
import emptyIcon from '../assest/empty@2x.png';

const EmptyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
`;

const EmptyIcon = styled.img`
    width: 160px;
    height: 160px;
    margin-top: 160px;

    @media (max-width: 480px) {
       width: 120px;
       height: 120px;
       margin-top: 20px;
    }
`;

// 提示文本样式（如需显示自定义文案可恢复使用）
// const EmptyText = styled.div`
//     color: #8b90a2;
//     font-size: 12px;
//     margin-top: 12px;
//     padding: 0 20px;
// `;

/**
 * Empty 空状态组件
 * @param {string} text - Message text, default is "No data yet"
 * @param {string} icon - 自定义图标路径，默认使用 empty@2x.png
 * @param {React.ReactNode} action - 自定义操作区域（按钮等）
 * @param {Array<{text: string, onClick: function, disabled?: boolean}>} actions - 操作按钮数组（如果提供了 action，则忽略此参数）
 * @param {string} className - 自定义类名
 */
function Empty({ 
    text = 'No data yet', 
    icon, 
    action, 
    actions = [],
    className 
}) {

    return (
        <EmptyContainer className={className}>
            <EmptyIcon src={icon || emptyIcon} alt="empty" />
            {/* {text && <EmptyText>{text}</EmptyText>} */}
        </EmptyContainer>
    );
}

export default Empty;

