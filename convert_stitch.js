import fs from 'fs';

const sourceFile = 'stitch_beranda.html';
const targetFile = 'resources/js/Pages/Welcome.jsx';

try {
    let data = fs.readFileSync(sourceFile, 'utf8');
    
    // Extract the body content
    const bodyMatch = data.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) {
        console.error("Could not find body tag");
        process.exit(1);
    }
    
    let content = bodyMatch[1];
    
    // Convert HTML to JSX
    content = content.replace(/class=/g, 'className=');
    content = content.replace(/for=/g, 'htmlFor=');
    content = content.replace(/<!--[\s\S]*?-->/g, ''); // Remove comments
    
    // Handle self-closing tags
    content = content.replace(/<img([^>]+)>/g, (match) => {
        if (match.endsWith('/>')) return match;
        return match.slice(0, -1) + ' />';
    });
    content = content.replace(/<input([^>]+)>/g, (match) => {
        if (match.endsWith('/>')) return match;
        return match.slice(0, -1) + ' />';
    });
    content = content.replace(/<br([^>]+)?>/g, '<br />');
    content = content.replace(/<hr([^>]+)?>/g, '<hr />');
    
    // Remove script tags at the bottom if any
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    
    // Replace SVG strings that might use style="str" with objects (Stitch svgs usually don't have style="str" but just in case)
    // Actually, in Stitch it's mostly Tailwind. So this should be fine.
    
    const jsxContent = `import { Head, Link } from '@inertiajs/react';

export default function Welcome({ canLogin, canRegister }) {
    return (
        <>
            <Head title="Welcome to WonderPark" />
            <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen font-['Inter']">
                ${content}
            </div>
        </>
    );
}`;

    fs.writeFileSync(targetFile, jsxContent);
    console.log("Successfully converted and saved to " + targetFile);
} catch (err) {
    console.error("Error processing file:", err);
}
