
'use client';

import { useState } from 'react';

export default function UploadDocument() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState('');

    async function upload() {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setStatus('Uploading...');

        try {
            const response = await fetch(
                'http://localhost:4000/documents/upload',
                {
                    method: 'POST',
                    body: formData,
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            setStatus(
                `Uploaded successfully. Chunks: ${data.chunksCreated}`,
            );
        } catch {
            setStatus('Upload failed');
        }
    }

    return (
        <section className="mb-6 rounded border p-4">
            <h2 className="mb-3 font-bold">Upload Study Document</h2>

            <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <button
                onClick={upload}
                className="ml-2 rounded bg-green-600 px-4 py-2 text-white"
            >
                Upload
            </button>

            <p className="mt-2">{status}</p>
        </section>
    );
}
