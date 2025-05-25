import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import TextInfoModel from "../AtomicComponents/TextInfoModel.jsx";

const appTitle = "SUPSI - SmartPhysio";

const Header = () => {
    return (
        <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: '#117BB5' }}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '0000' }}>
                    <TextInfoModel
                        textInfo={appTitle}
                        className="app-title"
                    />
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
