/* --- Navigation and SEO --- */
function showTool(toolId, toolTitle, updateHistory = true) {
    document.querySelectorAll('.tool-section').forEach(sec => sec.classList.remove('active-section'));
    document.getElementById(toolId).classList.add('active-section');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if(item.getAttribute('onclick').includes(toolId)) item.classList.add('active');
    });

    // --- SEO FIX: Dynamic Title and URL Update ---
    const defaultTitle = "NexusKit Dashboard | Online Utility Tools";
    const newTitle = toolTitle ? `${toolTitle} | NexusKit` : defaultTitle;
    
    document.title = newTitle;

    if (updateHistory) {
        let newPath = (toolId === 'home') ? '/' : `/${toolId}`;
        
        // Use history.pushState for a clean URL without reloading the page
        window.history.pushState({ toolId: toolId }, newTitle, newPath);
    }
}

// Global window event listener to handle back/forward button presses (SEO)
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.toolId) {
        // Find the title from the history state, or use a default
        const toolId = event.state.toolId;
        const navItem = document.querySelector(`.nav-item[onclick*="showTool('${toolId}')"]`);
        const title = navItem ? navItem.innerText.trim() : null;
        
        // Re-run showTool without pushing a new history state
        showTool(toolId, title, false); 
    } else {
        // Go back to home if state is empty (e.g., initial page load)
        showTool('home', null, false);
    }
});


/* --- Global Clear Function --- */
function clearTool(inputId, resultId, isSpecialClear = false) {
    // Clear the input field
    const input = document.getElementById(inputId);
    if(input) input.value = '';
    
    // Clear the result area
    const result = document.getElementById(resultId);
    if(result) {
        result.innerText = '';
        result.innerHTML = ''; 
    }
    
    // Specific resets for Password Strength
    if(inputId === 'pass-result') {
        document.getElementById('strength-bar').style.width = '0%';
        document.getElementById('pass-strength-text').innerText = 'Strength: N/A';
        input.placeholder = "Generated Password";
    }

    // Specific resets for QR
    if(isSpecialClear && inputId === 'qr-text') {
        document.getElementById('qr-download-btn').style.display = 'none';
        qrImageUrl = "";
    }
    
    // Specific resets for Image Converter
    if (isSpecialClear && inputId === 'file-input') {
        imageFiles = []; // Clear the file array
        renderFileList(); // Update the displayed list
        document.getElementById('conversion-status').innerText = 'Input cleared.';
    }
}

/* --- 1. Age Calculator --- */
function calculateAge() {
    const dobInput = document.getElementById('age-input').value;
    if (!dobInput) return alert("Please enter your birth date!");
    
    const dob = new Date(dobInput);
    const today = new Date();
    
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    document.getElementById('age-result').innerText = `You are ${age} years old.`;
}

/* --- 2. Temp Converter (Simple C to F) --- */
function convertTemp() {
    const val = parseFloat(document.getElementById('temp-input').value);
    const type = document.getElementById('temp-type').value;
    const res = document.getElementById('temp-result');

    if (isNaN(val)) return res.innerText = "Please enter a number.";

    if (type === 'c-to-f') {
        const f = (val * 9/5) + 32;
        res.innerText = `${val}°C = ${f.toFixed(2)}°F`;
    } else {
        const c = (val - 32) * 5/9;
        res.innerText = `${val}°F = ${c.toFixed(2)}°C`;
    }
}

/* --- 3. QR Generator with Download --- */
let qrImageUrl = ""; 

function generateQR() {
    const text = document.getElementById('qr-text').value;
    const container = document.getElementById('qr-container');
    const downloadBtn = document.getElementById('qr-download-btn');
    
    if(!text) {
        clearTool('qr-text', 'qr-container', true);
        return alert("Please enter text!");
    }
    
    qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
    
    container.innerHTML = `<img src="${qrImageUrl}" alt="QR Code" style="margin-top:20px; border:1px solid #ddd; padding:5px;">`;
    
    downloadBtn.style.display = 'block';
}

async function downloadQR() {
    if(!qrImageUrl) return;
    try {
        const response = await fetch(qrImageUrl);
        const blob = await response.blob();
        
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = "qrcode.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        alert("Could not download image automatically. Right-click the image and select 'Save Image As'.");
    }
}

/* --- 4. Advanced Password Generator --- */
function generatePassword() {
    const length = parseInt(document.getElementById('pass-length').value);
    const useUpper = document.getElementById('inc-upper').checked;
    const useNum = document.getElementById('inc-num').checked;
    const useSym = document.getElementById('inc-sym').checked;
    
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const syms = "!@#$%^&*()_+";

    let chars = lower;
    if(useUpper) chars += upper;
    if(useNum) chars += nums;
    if(useSym) chars += syms;

    if (chars.length === 0) {
        document.getElementById('pass-result').value = 'Select at least one option!';
        checkStrength('');
        return;
    }

    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const passField = document.getElementById('pass-result');
    passField.value = password;
    
    checkStrength(password);
}

function checkStrength(password) {
    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('pass-strength-text');
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const DANGER = '#ff7675';
    const WARNING = '#fdcb6e';
    const SUCCESS = '#00b894';
    const WHITE = '#fff';

    if (strength === 0) {
        bar.style.width = "0%"; bar.style.background = WHITE; text.innerText = "Strength: N/A";
    } else if (strength <= 1) {
        bar.style.width = "25%"; bar.style.background = DANGER; text.innerText = "Strength: Weak";
    } else if (strength <= 3) {
        bar.style.width = "60%"; bar.style.background = WARNING; text.innerText = "Strength: Medium";
    } else {
        bar.style.width = "100%"; bar.style.background = SUCCESS; text.innerText = "Strength: Strong";
    }
}

function copyPassword() {
    const passField = document.getElementById('pass-result');
    if(!passField.value) return;
    
    passField.select();
    document.execCommand("copy"); 
}

/* --- 5. Unit Converter (COMPREHENSIVE) --- */
const UNIT_CONVERSIONS = {
    length: {
        baseUnit: 'meter', 
        units: {
            meter: { name: 'Meter', symbol: 'm', factor: 1 },
            kilometer: { name: 'Kilometer', symbol: 'km', factor: 1000 },
            centimeter: { name: 'Centimeter', symbol: 'cm', factor: 0.01 },
            millimeter: { name: 'Millimeter', symbol: 'mm', factor: 0.001 },
            mile: { name: 'Mile', symbol: 'mi', factor: 1609.34 },
            yard: { name: 'Yard', symbol: 'yd', factor: 0.9144 },
            foot: { name: 'Foot', symbol: 'ft', factor: 0.3048 },
            inch: { name: 'Inch', symbol: 'in', factor: 0.0254 }
        }
    },
    mass: {
        baseUnit: 'kilogram',
        units: {
            kilogram: { name: 'Kilogram', symbol: 'kg', factor: 1 },
            gram: { name: 'Gram', symbol: 'g', factor: 0.001 },
            milligram: { name: 'Milligram', symbol: 'mg', factor: 0.000001 },
            ton: { name: 'Metric Ton', symbol: 't', factor: 1000 },
            pound: { name: 'Pound', symbol: 'lb', factor: 0.453592 },
            ounce: { name: 'Ounce', symbol: 'oz', factor: 0.0283495 }
        }
    },
    area: {
        baseUnit: 'sq_meter',
        units: {
            sq_meter: { name: 'Sq Meter', symbol: 'm²', factor: 1 },
            sq_kilometer: { name: 'Sq Kilometer', symbol: 'km²', factor: 1000000 },
            sq_foot: { name: 'Sq Foot', symbol: 'ft²', factor: 0.092903 },
            sq_mile: { name: 'Sq Mile', symbol: 'mi²', factor: 2589988 },
            acre: { name: 'Acre', symbol: 'ac', factor: 4046.86 }
        }
    },
    volume: {
        baseUnit: 'liter',
        units: {
            liter: { name: 'Liter', symbol: 'L', factor: 1 },
            milliliter: { name: 'Milliliter', symbol: 'mL', factor: 0.001 },
            cubic_meter: { name: 'Cubic Meter', symbol: 'm³', factor: 1000 },
            gallon: { name: 'Gallon (US)', symbol: 'gal', factor: 3.78541 },
            quart: { name: 'Quart (US)', symbol: 'qt', factor: 0.946353 }
        }
    },
    data: {
        baseUnit: 'byte',
        units: {
            byte: { name: 'Byte', symbol: 'B', factor: 1 },
            kilobyte: { name: 'Kilobyte', symbol: 'KB', factor: 1024 },
            megabyte: { name: 'Megabyte', symbol: 'MB', factor: 1048576 }, // 1024^2
            gigabyte: { name: 'Gigabyte', symbol: 'GB', factor: 1073741824 }, // 1024^3
            terabyte: { name: 'Terabyte', symbol: 'TB', factor: 1099511627776 } // 1024^4
        }
    },
    temperature: {
        units: {
            celsius: { name: 'Celsius', symbol: '°C' },
            fahrenheit: { name: 'Fahrenheit', symbol: '°F' },
            kelvin: { name: 'Kelvin', symbol: 'K' }
        },
        convert: (value, fromUnit, toUnit) => {
            if (fromUnit === toUnit) return value;
            
            // 1. Convert everything to Celsius first (Base)
            let celsiusValue;
            if (fromUnit === 'celsius') celsiusValue = value;
            else if (fromUnit === 'fahrenheit') celsiusValue = (value - 32) * 5/9;
            else if (fromUnit === 'kelvin') celsiusValue = value - 273.15;
            
            // 2. Convert from Celsius to Target
            if (toUnit === 'celsius') return celsiusValue;
            else if (toUnit === 'fahrenheit') return (celsiusValue * 9/5) + 32;
            else if (toUnit === 'kelvin') return celsiusValue + 273.15;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the unit converter dropdowns on load
    updateUnitConverterDropdowns(); 
    
    // --- Mobile Sidebar Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Hide sidebar when a nav item is clicked on mobile
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                // Check if screen is mobile size (768px matches CSS media query)
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }
});


function updateUnitConverterDropdowns() {
    const categoryId = document.getElementById('conversion-category').value;
    const conversion = UNIT_CONVERSIONS[categoryId];
    const fromUnitSelect = document.getElementById('from-unit');
    const toUnitSelect = document.getElementById('to-unit');

    fromUnitSelect.innerHTML = '';
    toUnitSelect.innerHTML = '';

    if (!conversion || !conversion.units) return;

    // Populate both dropdowns with options from the selected category
    for (const id in conversion.units) {
        const unit = conversion.units[id];
        
        const option1 = document.createElement('option');
        option1.value = id;
        option1.textContent = `${unit.name} (${unit.symbol})`;
        fromUnitSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = id;
        option2.textContent = `${unit.name} (${unit.symbol})`;
        toUnitSelect.appendChild(option2);
    }
    
    // Set default selection 
    const unitIds = Object.keys(conversion.units);
    if (unitIds.length > 1) {
        fromUnitSelect.value = unitIds[0];
        toUnitSelect.value = unitIds[1];
    } else if (unitIds.length === 1) {
        fromUnitSelect.value = unitIds[0];
        toUnitSelect.value = unitIds[0];
    }
    
    document.getElementById('unit-result').innerText = '';
}

function convertUnit() {
    const val = parseFloat(document.getElementById('unit-input').value);
    const categoryId = document.getElementById('conversion-category').value;
    const fromId = document.getElementById('from-unit').value;
    const toId = document.getElementById('to-unit').value;
    const res = document.getElementById('unit-result');
    const conversion = UNIT_CONVERSIONS[categoryId];

    if (isNaN(val)) return res.innerText = "Enter a valid number.";
    if (fromId === toId) return res.innerText = `${val} is already ${val}.`;
    if (!conversion) return res.innerText = "Conversion category error.";

    let result;
    const fromUnit = conversion.units[fromId];
    const toUnit = conversion.units[toId];

    if (categoryId === 'temperature') {
        // Use the special temperature converter function
        result = conversion.convert(val, fromId, toId);
    } else {
        // Standard Unit Conversion using Base Unit
        
        // 1. Convert input value to the category's Base Unit
        const valInBase = val * fromUnit.factor;
        
        // 2. Convert Base Unit value to the Target Unit
        result = valInBase / toUnit.factor;
    }

    // Display the result
    res.innerText = `${val} ${fromUnit.symbol} = ${result.toFixed(6)} ${toUnit.symbol}`;
}


/* --- 6. Image Converter Logic --- */
let imageFiles = [];

document.addEventListener('DOMContentLoaded', () => {
    // Initial call to show home tool and set initial URL/state on load
    showTool('home', 'Home', true); 

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    if (dropZone && fileInput) {
        document.getElementById('file-trigger').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files));

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        dropZone.addEventListener('drop', handleDrop, false);

        document.getElementById('enable-resize').addEventListener('change', (e) => {
            document.getElementById('resize-options').style.display = e.target.checked ? 'block' : 'none';
        });
    }
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    document.getElementById('drop-zone').classList.add('highlight');
}

function unhighlight() {
    document.getElementById('drop-zone').classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFileSelect(files);
}

function handleFileSelect(files) {
    if (files.length === 0) return;
    
    document.getElementById('conversion-status').innerText = '';
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const existingFile = imageFiles.find(f => f.name === file.name && f.size === file.size);
            if (!existingFile) {
                imageFiles.push(file);
            }
        }
    });
    renderFileList();
}

function renderFileList() {
    const list = document.getElementById('file-list');
    const container = document.getElementById('file-list-container');
    list.innerHTML = '';
    
    if (imageFiles.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    imageFiles.forEach(file => {
        const listItem = document.createElement('li');
        const sizeKB = (file.size / 1024).toFixed(2);
        listItem.innerHTML = `
            <span>${file.name}</span>
            <span style="font-weight: normal; color: #aaa;">(${sizeKB} KB)</span>
        `;
        list.appendChild(listItem);
    });
    container.style.display = 'block';
    
    document.getElementById('conversion-status').innerText = `${imageFiles.length} file(s) ready.`;
}

function startConversion() {
    if (imageFiles.length === 0) {
        document.getElementById('conversion-status').innerText = "Please select at least one image file.";
        return;
    }
    
    const targetFormat = document.getElementById('target-format').value;
    const enableResize = document.getElementById('enable-resize').checked;
    const resizeWidth = parseInt(document.getElementById('resize-width').value);
    const resizeHeight = parseInt(document.getElementById('resize-height').value);
    const jpegQuality = parseFloat(document.getElementById('jpeg-quality').value);

    document.getElementById('conversion-status').innerText = `Starting conversion of ${imageFiles.length} file(s) to ${targetFormat.toUpperCase()}...`;

    let completedCount = 0;
    
    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;

                if (enableResize) {
                    width = resizeWidth;
                    height = resizeHeight;
                }

                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);

                let mimeType = `image/${targetFormat}`;
                // toBlob handles quality for JPEG, ignores for PNG
                let finalQuality = targetFormat === 'jpeg' ? jpegQuality : 1.0; 

                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    
                    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    const downloadName = `${originalName}_converted.${targetFormat}`;
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = downloadName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    completedCount++;
                    if (completedCount === imageFiles.length) {
                        document.getElementById('conversion-status').innerText = 
                            `✅ Batch conversion complete! ${completedCount} file(s) downloaded.`;
                        imageFiles = [];
                        renderFileList();
                    }
                }, mimeType, finalQuality);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}