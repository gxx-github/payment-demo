import React from 'react';
import { HeaderBar, HeaderInner, LogoImg } from './styled/Layout.jsx';
import logo from '../assest/logo@2x.png';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import styled from 'styled-components';

const HeaderContent = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    
    @media (max-width: 480px) {
        padding: 0 12px;
    }
`;

function Header() {
    return (
        <HeaderBar>
            <HeaderInner>
                <HeaderContent>
                    <LogoImg src={logo} alt="WEA" />
                    <LanguageSwitcher />
                </HeaderContent>
            </HeaderInner>
        </HeaderBar>
    );
}

export default Header;


