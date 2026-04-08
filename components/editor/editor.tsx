'use client';

import { initAdvancedEditor } from '../imgly';
import CreativeEditor from '@cesdk/cesdk-js/react';

export default function AdvancedEditor() {
    return (
        <CreativeEditor
            config={{ baseURL: '/assets' }}
            init={initAdvancedEditor}
            width="100vw"
            height="100vh"
        />
    );
}