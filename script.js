// Module de Gestion de l'Historique
class HistoryModule {
    constructor(canvas) {
        this.canvas = canvas;
        this.history = [];
        this.currentIndex = -1;
    }

    enregistrerEtat() {
        // Supprimer les états futurs si on enregistre un nouvel état
        this.history = this.history.slice(0, this.currentIndex + 1);
        // Enregistrer l'état actuel du canevas
        this.history.push(JSON.stringify(this.canvas.toJSON()));
        this.currentIndex++;
    }

    annuler() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.canvas.clear();
            this.canvas.loadFromJSON(this.history[this.currentIndex], () => {
                this.canvas.renderAll();
            });
        } else {
            alert("Aucun état précédent disponible.");
        }
    }

    retablir() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.canvas.clear();
            this.canvas.loadFromJSON(this.history[this.currentIndex], () => {
                this.canvas.renderAll();
            });
        } else {
            alert("Aucun état suivant disponible.");
        }
    }
}

// Module de Gestion des Couleurs
class ColorModule {
    constructor() {
        this.selectedColorBtn = null;
        this.selectedShapeColor = "#000000"; // Valeur par défaut
    }

    init() {
        this.setupCustomColorPicker();
        this.setupShapeColorPicker();
        this.setupColorSelection();
    }

    setupCustomColorPicker() {
        const unifiedColorPicker = document.getElementById('unified-color-picker');

        if (unifiedColorPicker) {
            unifiedColorPicker.addEventListener('change', (e) => {
                this.selectedShapeColor = e.target.value;
            });
        } else {
            console.warn("Le sélecteur de couleur unique est introuvable.");
        }
    }

    setupShapeColorPicker() {
        const unifiedColorPicker = document.getElementById('unified-color-picker');
        if (unifiedColorPicker) {
            unifiedColorPicker.addEventListener('change', (e) => {
                this.selectedShapeColor = e.target.value; // Met à jour la couleur de forme
            });
        } else {
            console.warn("Le sélecteur de couleur des formes avec l'ID 'unified-color-picker' est introuvable.");
        }
    }

    setupColorSelection() {
        const colorOptions = document.querySelectorAll('.colors .option:not(:last-child)');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (this.selectedColorBtn) {
                    this.selectedColorBtn.classList.remove("selected");
                }
                option.classList.add("selected");
                this.selectedColorBtn = option;
            });
        });
    }

    getBrushColor() {
        const unifiedColorPicker = document.getElementById('unified-color-picker');
        if (unifiedColorPicker) {
            return unifiedColorPicker.value || "#000000"; // Couleur par défaut
        }
        console.error("Sélecteur de couleur unique introuvable.");
        return "#000000"; // Valeur par défaut si le sélecteur est manquant
    }

    getShapeColor() {
        return this.selectedShapeColor;
    }
}

// Module de Gestion du Pinceau et de la Gomme
class BrushModule {
    constructor(canvas, colorModule, historyModule) {
        this.canvas = canvas;
        this.colorModule = colorModule;
        this.history = historyModule;
        this.sizeSlider = document.querySelector("#unified-size-slider");
    }

    init() {
        this.setupBrush();
        this.setupEraser();
        this.setupSizeSlider();
        this.setupMouseUp();
    }

    setupBrush() {
        const brushBtn = document.getElementById('brush');
        if (brushBtn) {
            brushBtn.addEventListener('click', () => {
                this.canvas.isDrawingMode = true;
                this.canvas.selection = false;
                this.canvas.freeDrawingBrush.color = this.colorModule.getBrushColor();
                this.canvas.freeDrawingBrush.width = parseInt(this.sizeSlider.value, 10);
            });
        } else {
            console.warn("Le bouton 'Pinceau' avec l'ID 'brush' est introuvable.");
        }
    }

    setupEraser() {
        const eraserBtn = document.getElementById('eraser');
        if (eraserBtn) {
            eraserBtn.addEventListener('click', () => {
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush.color = "white";
                this.canvas.freeDrawingBrush.width = parseInt(this.sizeSlider.value, 10);
            });
        } else {
            console.warn("Le bouton 'Gomme' avec l'ID 'eraser' est introuvable.");
        }
    }

    setupSizeSlider() {
        const unifiedSizeSlider = document.querySelector("#unified-size-slider");
        if (unifiedSizeSlider) {
            unifiedSizeSlider.addEventListener('change', (e) => {
                const size = parseInt(e.target.value, 10);
                if (this.canvas.isDrawingMode) {
                    this.canvas.freeDrawingBrush.width = size;
                }
            });
        } else {
            console.warn("Le curseur de taille unique est introuvable.");
        }
    }

    setupMouseUp() {
        this.canvas.on('mouse:up', () => {
            if (this.canvas.isDrawingMode) {
                this.canvas.isDrawingMode = false;
                this.canvas.selection = true;

                const unifiedColorPicker = document.getElementById('unified-color-picker');
                if (unifiedColorPicker) {
                    const brushColor = unifiedColorPicker.value || "#000000"; // Couleur par défaut
                    this.canvas.freeDrawingBrush.color = brushColor; // Appliquer la couleur de pinceau
                } else {
                    console.error("Le sélecteur de couleur unique 'unified-color-picker' est introuvable.");
                    this.canvas.freeDrawingBrush.color = "#000000"; // Utiliser une couleur par défaut si l'élément est introuvable
                }

                // Vérifiez que sizeSlider est également accessible
                if (this.sizeSlider) {
                    this.canvas.freeDrawingBrush.width = parseInt(this.sizeSlider.value, 10);
                } else {
                    console.error("Le sélecteur de taille 'sizeSlider' est introuvable.");
                }

                this.history.enregistrerEtat(); // Enregistrer l'état après dessin
            }
        });
    }
}

// Module de Gestion des Pages
class PageModule {
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.backgroundColor = '#ffffff'; // Couleur de fond par défaut
        this.history = historyModule;
        this.pages = [];
        this.currentPageIndex = 0;
        this.pageListElement = document.getElementById('page-list');
        this.addPageBtn = document.getElementById('add-page-btn');
        this.prevPageBtn = document.getElementById('prev-page-btn');
        this.nextPageBtn = document.getElementById('next-page-btn');
    }

    init() {
        this.addPage();
        this.addPageBtn.addEventListener('click', () => this.addPage());
        this.prevPageBtn.addEventListener('click', () => this.prevPage());
        this.nextPageBtn.addEventListener('click', () => this.nextPage());

        // Ajouter l'écouteur pour le bouton "Supprimer la Page"
        const deletePageBtn = document.getElementById('delete-page-btn');
        if (deletePageBtn) {
            deletePageBtn.addEventListener('click', () => this.deleteCurrentPage());
        } else {
            console.warn("Le bouton 'Supprimer la Page' avec l'ID 'delete-page-btn' est introuvable.");
        }
    }

    addPage() {
        // Enregistrer l'état de la page actuelle avant d'ajouter une nouvelle page
        if (this.pages[this.currentPageIndex]) {
            this.pages[this.currentPageIndex].canvasState = JSON.stringify(this.canvas.toJSON());
        }

        const newPage = {
            id: this.pages.length + 1,
            name: `Page ${this.pages.length + 1}`,
            canvasState: null
        };
        this.pages.push(newPage);
        this.renderPageList();
        this.switchToPage(this.pages.length - 1);
    }

    renderPageList() {
        this.pageListElement.innerHTML = '';
        this.pages.forEach((page, index) => {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = page.name;
            pageBtn.classList.add('page-btn');
            if (index === this.currentPageIndex) {
                pageBtn.classList.add('active');
            }

            // Événement de clic pour changer de page
            pageBtn.addEventListener('click', () => this.switchToPage(index));

            // Événement de double-clic pour renommer la page
            pageBtn.addEventListener('dblclick', (e) => {
                e.stopPropagation(); // Empêche le déclenchement de l'événement de clic
                this.renamePage(index);
            });

            this.pageListElement.appendChild(pageBtn);
        });
    }

    switchToPage(index) {
        // Vérifier si l'index est valide
        if (index < 0 || index >= this.pages.length) {
            alert("Page inexistante.");
            return;
        }

        // Enregistrer l'état de la page actuelle avant de changer, seulement si on change de page
        if (this.currentPageIndex !== index && this.pages[this.currentPageIndex]) {
            this.pages[this.currentPageIndex].canvasState = JSON.stringify(this.canvas.toJSON());
        }

        // Charger l'état de la nouvelle page
        const newPage = this.pages[index];

        // Effacer le canevas actuel
        this.canvas.clear();

        // Charger l'état de la nouvelle page si disponible
        if (newPage.canvasState) {
            this.canvas.loadFromJSON(newPage.canvasState, () => {
                this.canvas.setBackgroundColor(this.backgroundColor, this.canvas.renderAll.bind(this.canvas));
                this.canvas.renderAll();
            });
        } else {
            // Si la nouvelle page n'a pas d'état enregistré, configurez le canevas au format A4
            this.setupA4Canvas();
        }

        // Mettre à jour l'index de la page actuelle
        this.currentPageIndex = index;

        // Rendre la liste des pages
        this.renderPageList();

        // Enregistrer l'état de la page actuelle après le changement
        this.history.enregistrerEtat();
    }

    // Méthode pour renommer une page
    renamePage(index) {
        const currentName = this.pages[index].name;
        const newName = prompt("Entrez le nouveau nom de la page :", currentName);
        if (newName && newName.trim() !== "") {
            // Vérifier si le nom est déjà utilisé
            const nameExists = this.pages.some((page, idx) => page.name === newName && idx !== index);
            if (nameExists) {
                alert("Ce nom de page est déjà utilisé. Veuillez choisir un autre nom.");
                return;
            }
            this.pages[index].name = newName.trim();
            this.renderPageList();
            this.history.enregistrerEtat();
        } else {
            alert("Le nom de la page ne peut pas être vide.");
        }
    }

    deleteCurrentPage() {
        if (this.pages.length <= 1) {
            alert("Il doit y avoir au moins une page.");
            return;
        }

        // Enregistrer l'état de la page actuelle avant de la supprimer
        this.pages[this.currentPageIndex].canvasState = JSON.stringify(this.canvas.toJSON());

        // Supprimer la page de la liste des pages
        this.pages.splice(this.currentPageIndex, 1);

        // Mettre à jour l'index de la page actuelle
        if (this.currentPageIndex >= this.pages.length) {
            this.currentPageIndex = this.pages.length - 1;
        }

        // Renuméroter les pages restantes pour assurer l'unicité et la séquence
        this.pages.forEach((page, index) => {
            page.id = index + 1;
            // Si le nom suit le format "Page X", mettre à jour le numéro
            if (/^Page \d+$/.test(page.name)) {
                page.name = `Page ${index + 1}`;
            }
        });

        // Rendre la liste des pages
        this.renderPageList();

        // Effacer le canevas actuel
        this.canvas.clear();

        // Charger l'état de la nouvelle page actuelle
        const newPage = this.pages[this.currentPageIndex];

        // Charger l'état de la nouvelle page si disponible
        if (newPage.canvasState) {
            this.canvas.loadFromJSON(newPage.canvasState, () => {
                this.canvas.setBackgroundColor(this.backgroundColor, this.canvas.renderAll.bind(this.canvas));
                this.canvas.renderAll();
            });
        } else {
            // Si la nouvelle page n'a pas d'état enregistré, configurez le canevas au format A4
            this.setupA4Canvas();
        }

        // Enregistrer l'état après suppression
        this.history.enregistrerEtat();

        alert("Page supprimée avec succès.");
    }

    prevPage() {
        if (this.currentPageIndex > 0) {
            this.switchToPage(this.currentPageIndex - 1);
        } else {
            alert("Vous êtes déjà sur la première page.");
        }
    }

    nextPage() {
        if (this.currentPageIndex < this.pages.length - 1) {
            this.switchToPage(this.currentPageIndex + 1);
        } else {
            alert("Vous êtes déjà sur la dernière page.");
        }
    }

    setupA4Canvas() {
        const width = 280 * 3.7795275591; // Largeur A4 en pixels (210mm)
        const height = 410 * 3.7795275591; // Hauteur A4 en pixels (297mm)
        this.canvas.setWidth(width);
        this.canvas.setHeight(height);
        this.canvas.setBackgroundColor(this.backgroundColor, this.canvas.renderAll.bind(this.canvas));
        this.canvas.renderAll();
    }

    loadFromJSON(jsonData) {
        try {
            const pagesData = JSON.parse(jsonData);

            if (!Array.isArray(pagesData)) {
                throw new Error("Le fichier JSON ne contient pas de données de pages valides.");
            }

            // Réinitialiser les pages existantes
            this.pages = [];
            this.currentPageIndex = 0;

            // Charger chaque page
            pagesData.forEach((pageData) => {
                const newPage = {
                    id: pageData.id,
                    name: pageData.name,
                    canvasState: pageData.canvasState
                };
                this.pages.push(newPage);
            });

            // Charger la première page
            this.switchToPage(0);

            // Rendre la liste des pages
            this.renderPageList();

        } catch (error) {
            alert("Erreur lors du chargement du fichier JSON : " + error.message);
        }
    }
}

// La suite du code sera fournie dans la partie 2.
// Module de Gestion des Formes et Mesures
class ShapesModule {
    constructor(canvas, colorModule, historyModule) {
        this.canvas = canvas;
        this.colorModule = colorModule;
        this.history = historyModule;
        this.pixelsPerCm = 37.7952755906; // Conversion pixels en cm (approximation)
        this.currentlyDrawing = false;
        this.tempShape = null;
        this.startX = 0;
        this.startY = 0;
    }

    init() {
        this.setupShapeButtons();
        this.setupAddTable();
        this.setupCanvasEvents();
    }

    setupShapeButtons() {
        const rectangleBtn = document.getElementById('rectangle');
        const rectangleFixedHeightBtn = document.getElementById('rectangle-fixed-height');
        const circleBtn = document.getElementById('circle');
        const triangleBtn = document.getElementById('triangle');

        if (rectangleBtn) {
            rectangleBtn.addEventListener('click', () => this.setDrawingMode('rectangle'));
        } else {
            console.warn("Le bouton 'Rectangle' avec l'ID 'rectangle' est introuvable.");
        }

        if (rectangleFixedHeightBtn) {
            rectangleFixedHeightBtn.addEventListener('click', () => this.setDrawingMode('rectangle-fixed-height'));
        } else {
            console.warn("Le bouton 'Rectangle à Hauteur Fixe' avec l'ID 'rectangle-fixed-height' est introuvable.");
        }

        if (circleBtn) {
            circleBtn.addEventListener('click', () => this.addCircle());
        } else {
            console.warn("Le bouton 'Cercle' avec l'ID 'circle' est introuvable.");
        }

        if (triangleBtn) {
            triangleBtn.addEventListener('click', () => this.addTriangle());
        } else {
            console.warn("Le bouton 'Triangle' avec l'ID 'triangle' est introuvable.");
        }
    }

    setDrawingMode(mode) {
        this.drawingMode = mode;
        console.log(`Mode de dessin sélectionné : ${mode}`);
    }

    setupCanvasEvents() {
        this.canvas.on('mouse:down', (opt) => this.onMouseDown(opt));
        this.canvas.on('mouse:move', (opt) => this.onMouseMove(opt));
        this.canvas.on('mouse:up', (opt) => this.onMouseUp(opt));
    }

    onMouseDown(opt) {
        if (!this.drawingMode) return;

        const pointer = this.canvas.getPointer(opt.e);
        this.startX = pointer.x;
        this.startY = pointer.y;
        this.currentlyDrawing = true;

        const color = this.colorModule.getShapeColor();
        const fillOption = this.getFillOption();

        if (this.drawingMode === 'rectangle') {
            this.tempShape = new fabric.Rect({
                left: this.startX,
                top: this.startY,
                fill: fillOption === 'filled' ? color : 'transparent',
                stroke: color,
                strokeWidth: 2,
                width: 0,
                height: 0,
                hasControls: true,
                hasBorders: true,
                selectable: true
            });
            this.canvas.add(this.tempShape);

            // Créer measurementText dès maintenant
            const measurementText = new fabric.Text('', {
                fontSize: 14,
                fill: 'black',
                selectable: false,
                originX: 'center',
                originY: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                stroke: 'black',
                strokeWidth: 0.5
            });
            this.canvas.add(measurementText);
            this.tempShape.measurementText = measurementText;
        } else if (this.drawingMode === 'rectangle-fixed-height') {
            const fixedHeight = 0.3 * this.pixelsPerCm; // 0.3 cm converti en pixels
            this.tempShape = new fabric.Rect({
                left: this.startX,
                top: this.startY,
                fill: 'transparent',
                stroke: color,
                strokeWidth: 2,
                width: 0,
                height: fixedHeight,
                hasControls: true,
                hasBorders: true,
                selectable: true,
                fixedHeightRectangle: true
            });
            this.canvas.add(this.tempShape);

            // Créer lengthMeasurementText dès maintenant
            const lengthMeasurementText = new fabric.Text('', {
                fontSize: 14,
                fill: 'black',
                selectable: false,
                originX: 'center',
                originY: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                stroke: 'black',
                strokeWidth: 0.5
            });
            this.canvas.add(lengthMeasurementText);
            this.tempShape.lengthMeasurementText = lengthMeasurementText;
        }
    }

    onMouseMove(opt) {
        if (!this.currentlyDrawing || !this.tempShape) return;

        const pointer = this.canvas.getPointer(opt.e);
        const width = pointer.x - this.startX;
        const height = pointer.y - this.startY;

        if (this.drawingMode === 'rectangle') {
            this.tempShape.set({ width: width, height: height });
            this.canvas.renderAll();
            this.updateShapeMeasurements(this.tempShape, this.tempShape.measurementText);
        } else if (this.drawingMode === 'rectangle-fixed-height') {
            this.tempShape.set({ width: width });
            this.canvas.renderAll();
            this.updateFixedRectangleMeasurement(this.tempShape, this.tempShape.lengthMeasurementText);
        }
    }

    onMouseUp(opt) {
        if (!this.currentlyDrawing) return;
        this.currentlyDrawing = false;
        this.drawingMode = null; // Réinitialiser le mode de dessin

        if (this.tempShape) {
            // Enregistrer l'état et ajouter les écouteurs pour les modifications futures
            if (this.tempShape.fixedHeightRectangle) {
                this.addFixedRectangleMeasurementListeners(this.tempShape);
            } else {
                this.addShapeMeasurementListeners(this.tempShape);
            }
            this.history.enregistrerEtat();
            this.tempShape = null;
        }
    }

    getFillOption() {
        const filledRadio = document.querySelector('input[name="shape-fill"]:checked');
        if (filledRadio) {
            return filledRadio.value === 'filled' ? 'filled' : 'hollow';
        }
        return 'filled'; // Valeur par défaut
    }

    addCircle() {
        const color = this.colorModule.getShapeColor();
        const fillOption = this.getFillOption();
        const circle = new fabric.Circle({
            radius: 50,
            left: 150,
            top: 100,
            fill: fillOption === 'filled' ? color : 'transparent',
            stroke: color,
            strokeWidth: 2,
            hasControls: true,
            hasBorders: true,
            selectable: true
        });
        this.canvas.add(circle);
        this.history.enregistrerEtat();
        this.addShapeMeasurements(circle);
    }

    addTriangle() {
        const color = this.colorModule.getShapeColor();
        const fillOption = this.getFillOption();
        const triangle = new fabric.Triangle({
            width: 100,
            height: 100,
            left: 150,
            top: 100,
            fill: fillOption === 'filled' ? color : 'transparent',
            stroke: color,
            strokeWidth: 2,
            hasControls: true,
            hasBorders: true,
            selectable: true
        });
        this.canvas.add(triangle);
        this.history.enregistrerEtat();
        this.addShapeMeasurements(triangle);
    }

    addShapeMeasurements(shape) {
        // Ne pas ajouter de mesures pour les rectangles à hauteur fixe
        if (shape.fixedHeightRectangle) return;

        const measurementText = new fabric.Text('', {
            fontSize: 14,
            fill: 'black',
            selectable: false,
            originX: 'center',
            originY: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)', // Fond blanc semi-transparent
            stroke: 'black',
            strokeWidth: 0.5
        });
        this.canvas.add(measurementText);
        this.history.enregistrerEtat();
        this.updateShapeMeasurements(shape, measurementText);

        shape.measurementText = measurementText;

        this.addShapeMeasurementListeners(shape);
    }

    updateShapeMeasurements(shape, measurementText) {
        if (!measurementText) return;

        let measurements = '';
        if (shape.type === 'rect') {
            const width = (shape.getScaledWidth() / this.pixelsPerCm).toFixed(2);
            const height = (shape.getScaledHeight() / this.pixelsPerCm).toFixed(2);
            measurements = `L: ${width} cm, H: ${height} cm`;
        } else if (shape.type === 'circle') {
            const radius = (shape.radius * shape.scaleX / this.pixelsPerCm).toFixed(2);
            const diameter = (2 * shape.radius * shape.scaleX / this.pixelsPerCm).toFixed(2);
            measurements = `R: ${radius} cm, D: ${diameter} cm`;
        } else if (shape.type === 'triangle') {
            const a = (shape.width * shape.scaleX / this.pixelsPerCm).toFixed(2);
            const b = (shape.height * shape.scaleY / this.pixelsPerCm).toFixed(2);
            const c = (Math.sqrt(Math.pow(shape.width, 2) + Math.pow(shape.height, 2)) * shape.scaleX / this.pixelsPerCm).toFixed(2);
            measurements = `Côtés: A: ${a} cm, B: ${b} cm, C: ${c} cm`;
        }
        measurementText.set({
            text: measurements,
            left: shape.left + shape.getScaledWidth() / 2,
            top: shape.top - 20,
            angle: 0 // Garder le texte horizontal
        });
        this.canvas.bringToFront(measurementText);
        this.canvas.renderAll();
    }

    addFixedRectangleMeasurementListeners(shape) {
        const measurementText = shape.lengthMeasurementText;
        shape.on('modified', () => {
            this.updateFixedRectangleMeasurement(shape, measurementText);
        });
        shape.on('scaling', () => {
            this.updateFixedRectangleMeasurement(shape, measurementText);
        });
        shape.on('moving', () => {
            this.updateFixedRectangleMeasurement(shape, measurementText);
        });
        shape.on('removed', () => {
            this.canvas.remove(measurementText);
        });
    }

    updateFixedRectangleMeasurement(shape, measurementText) {
        if (!measurementText) return;

        const width = (shape.getScaledWidth() / this.pixelsPerCm).toFixed(2);
        measurementText.set({
            text: `L: ${width} cm`,
            left: shape.left + shape.getScaledWidth() / 2,
            top: shape.top - 20,
            angle: 0 // Garder le texte horizontal
        });
        this.canvas.bringToFront(measurementText);
        this.canvas.renderAll();
    }

    addShapeMeasurementListeners(shape) {
        const measurementText = shape.measurementText;
        shape.on('modified', () => {
            this.updateShapeMeasurements(shape, measurementText);
        });
        shape.on('scaling', () => {
            this.updateShapeMeasurements(shape, measurementText);
        });
        shape.on('moving', () => {
            this.updateShapeMeasurements(shape, measurementText);
        });
        shape.on('removed', () => {
            this.canvas.remove(measurementText);
        });
    }

    setupAddTable() {
        const addTableBtn = document.getElementById('add-table-btn');
        if (addTableBtn) {
            addTableBtn.addEventListener('click', () => {
                const rows = parseInt(prompt("Nombre de lignes ?", "3"), 10);
                const cols = parseInt(prompt("Nombre de colonnes ?", "3"), 10);

                if (!isNaN(rows) && !isNaN(cols) && rows > 0 && cols > 0) {
                    this.addTable(rows, cols);
                } else {
                    alert("Veuillez entrer des valeurs valides pour les lignes et les colonnes.");
                }
            });
        } else {
            console.warn("Le bouton 'Ajouter un Tableau' avec l'ID 'add-table-btn' est introuvable.");
        }
    }

    addTable(rows = 3, cols = 3) {
        const tableGroup = new fabric.Group([], {
            selectable: true,
            hasBorders: true,
            hasControls: true,
            left: 150,
            top: 100
        });

        const cellWidth = 60;
        const cellHeight = 30;

        // Créer le tableau
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Créer une cellule
                const cell = new fabric.Rect({
                    left: col * cellWidth,
                    top: row * cellHeight,
                    width: cellWidth,
                    height: cellHeight,
                    fill: 'transparent',
                    stroke: 'black',
                    strokeWidth: 1,
                    selectable: false
                });

                // Créer le texte de la cellule
                const cellText = new fabric.Textbox('', {
                    left: col * cellWidth + 5,
                    top: row * cellHeight + 5,
                    fontSize: 12,
                    width: cellWidth - 10,
                    height: cellHeight - 10,
                    selectable: true,
                    editable: true,
                    textAlign: 'center'
                });

                // Ajouter la cellule et le texte au groupe
                tableGroup.addWithUpdate(cell);
                tableGroup.addWithUpdate(cellText);
            }
        }

        // Ajouter le groupe de tableau au canevas
        this.canvas.add(tableGroup);
        this.canvas.setActiveObject(tableGroup);
        this.canvas.renderAll();
        this.history.enregistrerEtat();
    }
}

// Module de Gestion du Texte
class TextModule {
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.history = historyModule;
        this.textPropertiesMenu = document.getElementById('text-properties-menu');

        // Récupérer les contrôles des propriétés de texte
        this.fontFamilySelect = document.getElementById('font-family');
        this.fontSizeInput = document.getElementById('font-size');
        this.fontWeightSelect = document.getElementById('font-weight');
        this.textColorInput = document.getElementById('text-color');

        // Garder une référence à l'objet texte sélectionné
        this.selectedText = null;
    }

    init() {
        this.setupAddTextButton();
        this.setupTextSelection();
        this.setupTextProperties();
    }

    setupAddTextButton() {
        const addTextBtn = document.getElementById('add-text-btn');
        if (addTextBtn) {
            addTextBtn.addEventListener('click', () => this.addText());
        } else {
            console.warn("Le bouton 'Ajouter Texte' avec l'ID 'add-text-btn' est introuvable.");
        }
    }

    addText() {
        const text = new fabric.IText('Entrez votre texte', {
            left: 150,
            top: 100,
            fontSize: 20,
            fontFamily: 'Arial',
            fill: '#000000',
            editable: true,
            selectable: true
        });
        this.canvas.add(text);
        this.history.enregistrerEtat();
        this.canvas.setActiveObject(text);
        this.canvas.renderAll();
    }

    setupTextSelection() {
        this.canvas.on('selection:created', (e) => this.handleSelection(e));
        this.canvas.on('selection:updated', (e) => this.handleSelection(e));
        this.canvas.on('selection:cleared', () => this.hideTextPropertiesMenu());
    }

    handleSelection(e) {
        const selected = e.selected[0];
        if (selected && selected.type === 'i-text') {
            this.selectedText = selected;
            this.showTextPropertiesMenu(selected);
        } else {
            this.selectedText = null;
            this.hideTextPropertiesMenu();
        }
    }

    showTextPropertiesMenu(text) {
        this.textPropertiesMenu.style.display = 'flex';
        this.updateTextPropertiesMenu(text);
    }

    hideTextPropertiesMenu() {
        this.textPropertiesMenu.style.display = 'none';
    }

    updateTextPropertiesMenu(text) {
        // Mettre à jour les valeurs des contrôles en fonction des propriétés de l'objet texte sélectionné
        this.fontFamilySelect.value = text.fontFamily || 'Arial';
        this.fontSizeInput.value = text.fontSize || 20;
        this.fontWeightSelect.value = text.fontWeight || 'normal';
        this.textColorInput.value = text.fill || '#000000';
    }

    setupTextProperties() {
        // Attacher les écouteurs d'événements aux contrôles des propriétés de texte

        this.fontFamilySelect.addEventListener('change', () => {
            if (this.selectedText) {
                this.selectedText.set('fontFamily', this.fontFamilySelect.value);
                this.canvas.renderAll();
                this.history.enregistrerEtat();
            }
        });

        this.fontSizeInput.addEventListener('input', () => {
            if (this.selectedText) {
                const size = parseInt(this.fontSizeInput.value, 10);
                if (!isNaN(size)) {
                    this.selectedText.set('fontSize', size);
                    this.canvas.renderAll();
                    this.history.enregistrerEtat();
                }
            }
        });

        this.fontWeightSelect.addEventListener('change', () => {
            if (this.selectedText) {
                this.selectedText.set('fontWeight', this.fontWeightSelect.value);
                this.canvas.renderAll();
                this.history.enregistrerEtat();
            }
        });

        this.textColorInput.addEventListener('input', () => {
            if (this.selectedText) {
                this.selectedText.set('fill', this.textColorInput.value);
                this.canvas.renderAll();
                this.history.enregistrerEtat();
            }
        });
    }
}

// Module de Gestion de l'Importation et de l'Exportation
class ImportExportModule {
    constructor(canvas, historyModule, pageModule) {
        this.canvas = canvas;
        this.history = historyModule;
        this.pageModule = pageModule; // Référence au module de pages
        this.nomFichierJSON = null;
    }

    init() {
        this.setupSaveImage();
        this.setupUploadImage();
        this.setupSaveJSON();
        this.setupLoadJSON();
        this.setupDeleteMeasurementText();
        this.setupClearCanvas();
    }

    setupSaveImage() {
        const saveImgBtn = document.querySelector(".save-img");
        if (saveImgBtn) {
            saveImgBtn.addEventListener("click", () => this.saveAsImage());
        } else {
            console.warn("Le bouton 'Enregistrer en Image' avec la classe 'save-img' est introuvable.");
        }
    }

    saveAsImage() {
        const dataURL = this.canvas.toDataURL({
            format: 'png',
            multiplier: 2
        });
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `canvas_${Date.now()}.png`;
        link.click();
    }

    setupUploadImage() {
        const uploadImageInput = document.getElementById("upload-image");
        if (uploadImageInput) {
            uploadImageInput.addEventListener("change", (e) => this.uploadImage(e));
        } else {
            console.warn("Le sélecteur d'image avec l'ID 'upload-image' est introuvable.");
        }
    }

    uploadImage(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            fabric.Image.fromURL(event.target.result, (img) => {
                img.set({
                    left: 150,
                    top: 100,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    selectable: true,
                    hasBorders: true,
                    hasControls: true
                });
                this.canvas.add(img);
                this.canvas.renderAll();
                this.history.enregistrerEtat();
            }, { crossOrigin: 'anonymous' });
        };
        reader.readAsDataURL(file);
    }

    setupSaveJSON() {
        const saveJSONBtn = document.getElementById("save-json");
        if (saveJSONBtn) {
            saveJSONBtn.addEventListener("click", () => this.saveAsJSON());
        } else {
            console.warn("Le bouton 'Enregistrer en JSON' avec l'ID 'save-json' est introuvable.");
        }
    }

    saveAsJSON() {
        // Enregistrer l'état de la page actuelle
        this.pageModule.pages[this.pageModule.currentPageIndex].canvasState = JSON.stringify(this.canvas.toJSON());
        const pagesData = this.pageModule.pages.map(page => ({
            id: page.id,
            name: page.name,
            canvasState: page.canvasState
        }));

        const json = JSON.stringify(pagesData);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = this.nomFichierJSON ? this.nomFichierJSON : `multi_page_canvas_${Date.now()}.json`;
        link.click();

        alert(this.nomFichierJSON ? `Modifications enregistrées dans ${this.nomFichierJSON}` : "Nouveau fichier JSON créé !");
    }

    setupLoadJSON() {
        const loadJSONInput = document.getElementById("load-json");
        if (loadJSONInput) {
            loadJSONInput.addEventListener("change", (e) => this.loadFromJSON(e));
        } else {
            console.warn("Le sélecteur de chargement JSON avec l'ID 'load-json' est introuvable.");
        }
    }

    loadFromJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.nomFichierJSON = file.name;

        const reader = new FileReader();
        reader.onload = (event) => {
            const json = event.target.result;
            this.pageModule.loadFromJSON(json);
            alert("Les pages ont été chargées avec succès !");
            this.history.enregistrerEtat();
        };
        reader.readAsText(file);
    }

    deleteSelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            // Supprimer le texte de mesure associé si présent
            const associatedText = activeObject.measurementText || activeObject.lengthMeasurementText;
            if (associatedText) {
                this.canvas.remove(associatedText);
            }
            this.canvas.remove(activeObject);
            this.canvas.renderAll();
            this.history.enregistrerEtat();
        } else {
            alert("Aucun objet sélectionné.");
        }
    }

    setupDeleteMeasurementText() {
        const deleteMeasurementBtn = document.getElementById('delete-measurement-text');
        if (deleteMeasurementBtn) {
            deleteMeasurementBtn.addEventListener("click", () => this.deleteMeasurementText());
        } else {
            console.warn("Le bouton 'Supprimer le texte de mesure' avec l'ID 'delete-measurement-text' est introuvable.");
        }
    }

    deleteMeasurementText() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            const associatedText = activeObject.measurementText || activeObject.lengthMeasurementText;
            if (associatedText) {
                this.canvas.remove(associatedText);
                if (activeObject.measurementText) {
                    delete activeObject.measurementText;
                }
                if (activeObject.lengthMeasurementText) {
                    delete activeObject.lengthMeasurementText;
                }
                this.canvas.renderAll();
                this.history.enregistrerEtat();
            } else {
                alert("Aucun texte de mesure associé à cet objet !");
            }
        } else {
            alert("Aucun objet sélectionné !");
        }
    }

    setupClearCanvas() {
        const clearCanvasBtn = document.querySelector('.clear-canvas');
        if (clearCanvasBtn) {
            clearCanvasBtn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir effacer le canevas ?')) {
                    this.canvas.clear();
                    this.canvas.backgroundColor = 'white';
                    this.canvas.renderAll();
                    this.history.enregistrerEtat();
                }
            });
        } else {
            console.warn("Le bouton 'Effacer Canevas' avec la classe 'clear-canvas' est introuvable.");
        }
    }
}

// Module de Gestion de l'Aperçu Avant Impression
class PrintPreviewModule {
    constructor(canvas) {
        this.canvas = canvas;
        this.printPreviewBtn = document.getElementById('print-preview-btn');

        if (this.printPreviewBtn) {
            this.printPreviewModal = document.getElementById('print-preview-modal');
            if (this.printPreviewModal) {
                this.closeModalSpan = this.printPreviewModal.querySelector('.close-modal');
                this.previewImage = document.getElementById('preview-image');
                this.printBtn = document.getElementById('print-btn');
            }
        }
    }

    init() {
        if (!this.printPreviewBtn || !this.printPreviewModal) {
            console.warn("Les éléments nécessaires pour l'aperçu avant impression sont manquants.");
            return;
        }
        this.setupPrintPreview();
        this.setupModalClose();
        this.setupPrint();
    }

    setupPrintPreview() {
        this.printPreviewBtn.addEventListener('click', () => this.showPreview());
    }

    showPreview() {
        const dataURL = this.canvas.toDataURL({
            format: 'png',
            multiplier: 2
        });
        if (this.previewImage) {
            this.previewImage.src = dataURL;
            this.printPreviewModal.style.display = 'block';
        }
    }

    setupModalClose() {
        if (this.closeModalSpan) {
            this.closeModalSpan.addEventListener('click', () => this.hidePreview());
        }
        window.addEventListener('click', (event) => {
            if (event.target === this.printPreviewModal) {
                this.hidePreview();
            }
        });
    }

    hidePreview() {
        if (this.printPreviewModal) {
            this.printPreviewModal.style.display = 'none';
        }
    }

    setupPrint() {
        if (this.printBtn) {
            this.printBtn.addEventListener('click', () => this.printCanvas());
        }
    }

    printCanvas() {
        if (!this.previewImage) return;

        const dataURL = this.canvas.toDataURL({
            format: 'png',
            multiplier: 2
        });

        const printWindow = window.open('', 'PrintWindow', 'width=800,height=600');
        printWindow.document.write('<html><head><title></title>');
        printWindow.document.write(`
            <style>
                @media print {
                    img {
                        max-width: 100%;
                        height: auto;
                        page-break-inside: avoid;
                    }
                    body {
                        margin: 0;
                    }
                }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<img src="${dataURL}" alt="Aperçu du Canevas">`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
}

// Module de Gestion de la Duplication d'Objets
class DuplicateModule {
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.history = historyModule;
        this.duplicateBtn = this.createDuplicateButton();
    }

    init() {
        this.setupEvents();
    }

    createDuplicateButton() {
        const btn = document.createElement('button');
        btn.innerHTML = '⤴️'; // Icône de duplication
        btn.classList.add('duplicate-btn');
        document.body.appendChild(btn);
        btn.style.display = 'none';
        return btn;
    }

    setupEvents() {
        this.duplicateBtn.addEventListener('click', () => this.duplicateObject());
        this.canvas.on('selection:created', () => this.showDuplicateButton());
        this.canvas.on('selection:updated', () => this.showDuplicateButton());
        this.canvas.on('selection:cleared', () => this.hideDuplicateButton());

        // Suppression via touche "Delete"
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Delete') {
                this.deleteSelectedObject();
            }
        });
    }

    showDuplicateButton() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            const canvasRect = this.canvas.upperCanvasEl.getBoundingClientRect();
            const objLeft = (activeObject.left + activeObject.getScaledWidth() / 2) * this.canvas.getZoom() + canvasRect.left;
            const objTop = activeObject.top * this.canvas.getZoom() + canvasRect.top;

            this.duplicateBtn.style.left = `${objLeft}px`;
            this.duplicateBtn.style.top = `${objTop}px`;
            this.duplicateBtn.style.display = 'block';
        }
    }

    hideDuplicateButton() {
        this.duplicateBtn.style.display = 'none';
    }

    duplicateObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone((clonedObj) => {
                clonedObj.set({
                    left: activeObject.left + 30,
                    top: activeObject.top + 30,
                    evented: true
                });
                this.canvas.add(clonedObj);
                this.canvas.setActiveObject(clonedObj);

                if (clonedObj.measurementText) {
                    clonedObj.measurementText.clone((clonedText) => {
                        clonedText.set({
                            left: clonedObj.left + clonedObj.getScaledWidth() / 2,
                            top: clonedObj.top - 20,
                            angle: 0
                        });
                        this.canvas.add(clonedText);
                        clonedObj.measurementText = clonedText;
                    });
                }

                this.canvas.renderAll();
                this.history.enregistrerEtat();
            });
        }
        this.hideDuplicateButton();
    }

    deleteSelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            const associatedText = activeObject.measurementText || activeObject.lengthMeasurementText;
            if (associatedText) {
                this.canvas.remove(associatedText);
            }
            this.canvas.remove(activeObject);
            this.canvas.renderAll();
            this.history.enregistrerEtat();
        }
    }
}

// Module de Gestion de la Palette de Photos
class PhotoPaletteModule {
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.history = historyModule;
        this.photoPaletteModal = document.getElementById('photo-palette-modal');
        this.openPaletteBtn = document.getElementById('open-photo-palette-btn');
        this.closePaletteSpan = this.photoPaletteModal ? this.photoPaletteModal.querySelector('.close-modal') : null;
        this.photoGallery = document.getElementById('photo-gallery');
        this.photoSearchInput = document.getElementById('photo-search');
        this.photos = []; // Tableau pour stocker les photos chargées
    }

    init() {
        this.setupOpenPalette();
        this.setupClosePalette();
        this.loadPhotos();
        this.setupSearch();
    }

    setupOpenPalette() {
        if (this.openPaletteBtn) {
            this.openPaletteBtn.addEventListener('click', () => this.showPalette());
        } else {
            console.warn("Le bouton 'Ouvrir la Palette de Photos' avec l'ID 'open-photo-palette-btn' est introuvable.");
        }
    }

    showPalette() {
        if (this.photoPaletteModal) {
            this.photoPaletteModal.style.display = 'block';
        }
    }

    setupClosePalette() {
        if (this.closePaletteSpan) {
            this.closePaletteSpan.addEventListener('click', () => this.hidePalette());
        } else {
            console.warn("Le bouton de fermeture de la palette de photos est introuvable.");
        }

        window.addEventListener('click', (event) => {
            if (event.target === this.photoPaletteModal) {
                this.hidePalette();
            }
        });
    }

    hidePalette() {
        if (this.photoPaletteModal) {
            this.photoPaletteModal.style.display = 'none';
        }
    }

    async loadPhotos() {
        try {
            const response = await fetch('merged.json');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement du fichier JSON');
            }
            const data = await response.json();
            this.photos = data;
            this.displayPhotos(this.photos);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger la palette de photos.');
        }
    }

    displayPhotos(photos) {
        if (!this.photoGallery) {
            console.warn("La galerie de photos avec l'ID 'photo-gallery' est introuvable.");
            return;
        }
        this.photoGallery.innerHTML = '';
        photos.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = photo.alt || 'Photo';
            img.title = photo.alt || 'Photo';
            img.style.width = '100px';
            img.style.height = 'auto';
            img.style.margin = '5px';
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => this.addPhotoToCanvas(photo.src));
            this.photoGallery.appendChild(img);
        });
    }

    addPhotoToCanvas(src) {
        fabric.Image.fromURL(src, (img) => {
            img.set({
                left: 100,
                top: 100,
                scaleX: 0.5,
                scaleY: 0.5,
                selectable: true,
                hasBorders: true,
                hasControls: true
            });
            this.canvas.add(img);
            this.canvas.renderAll();
            this.history.enregistrerEtat();
            this.hidePalette();
        }, {
            crossOrigin: 'anonymous',
        });
    }

    setupSearch() {
        if (this.photoSearchInput) {
            this.photoSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filteredPhotos = this.photos.filter(photo => {
                    const altText = (photo.alt || '').toLowerCase();
                    return altText.includes(query);
                });
                this.displayPhotos(filteredPhotos);
            });
        } else {
            console.warn("Le champ de recherche de photos avec l'ID 'photo-search' est introuvable.");
        }
    }
}

// Module de Gestion des Gestes Tactiles
class TouchGestureModule {
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.historyModule = historyModule;
        this.isPinching = false;
        this.lastDistance = 0;
        this.activeObject = null;
    }

    init() {
        // Écouteur pour touchstart
        this.canvas.upperCanvasEl.addEventListener('touchstart', this.onTouchStart.bind(this));

        // Écouteur pour touchmove
        this.canvas.upperCanvasEl.addEventListener('touchmove', this.onTouchMove.bind(this));

        // Écouteur pour touchend
        this.canvas.upperCanvasEl.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    onTouchStart(e) {
        if (e.touches.length === 2) {
            this.isPinching = true;
            this.activeObject = this.canvas.findTarget(e, true);

            if (this.activeObject && (this.activeObject.type === 'image' || this.activeObject.isType('image'))) {
                const point1 = new fabric.Point(e.touches[0].clientX, e.touches[0].clientY);
                const point2 = new fabric.Point(e.touches[1].clientX, e.touches[1].clientY);
                this.lastDistance = fabric.util.distance(point1, point2);
            } else {
                this.activeObject = null;
                this.isPinching = false;
            }
        }
    }

    onTouchMove(e) {
        if (this.isPinching && e.touches.length === 2 && this.activeObject) {
            e.preventDefault();

            const point1 = new fabric.Point(e.touches[0].clientX, e.touches[0].clientY);
            const point2 = new fabric.Point(e.touches[1].clientX, e.touches[1].clientY);
            const distance = fabric.util.distance(point1, point2);

            // Calculer le facteur d'échelle
            const scaleFactor = distance / this.lastDistance;

            // Appliquer les limites de mise à l'échelle
            const newScaleX = this.activeObject.scaleX * scaleFactor;
            const newScaleY = this.activeObject.scaleY * scaleFactor;

            const minScale = 0.1; // Échelle minimale
            const maxScale = 10;  // Échelle maximale

            if (newScaleX >= minScale && newScaleX <= maxScale && newScaleY >= minScale && newScaleY <= maxScale) {
                this.activeObject.scaleX = newScaleX;
                this.activeObject.scaleY = newScaleY;
                this.activeObject.setCoords();
                this.canvas.requestRenderAll();
                this.lastDistance = distance;
            }
        }
    }

    onTouchEnd(e) {
        if (this.isPinching) {
            this.isPinching = false;
            this.lastDistance = 0;
            this.activeObject = null;
            // Enregistrer l'état dans l'historique
            this.historyModule.enregistrerEtat();
        }
    }
}

// Classe Principale de l'Application
class App {
    constructor(canvas) {
        this.canvas = canvas;
        this.historyModule = new HistoryModule(canvas);
        this.colorModule = new ColorModule();
        this.brushModule = new BrushModule(canvas, this.colorModule, this.historyModule);
        this.shapesModule = new ShapesModule(canvas, this.colorModule, this.historyModule);
        this.textModule = new TextModule(canvas, this.historyModule);
        this.pageModule = new PageModule(canvas, this.historyModule);
        this.importExportModule = new ImportExportModule(canvas, this.historyModule, this.pageModule);
        this.printPreviewModule = new PrintPreviewModule(canvas);
        this.duplicateModule = new DuplicateModule(canvas, this.historyModule);
        this.photoPaletteModule = new PhotoPaletteModule(canvas, this.historyModule);
        this.touchGestureModule = new TouchGestureModule(canvas, this.historyModule);
    }

    init() {
        // Initialiser tous les modules
        this.colorModule.init();
        this.brushModule.init();
        this.shapesModule.init();
        this.textModule.init();
        this.pageModule.init();
        this.importExportModule.init();
        this.printPreviewModule.init();
        this.duplicateModule.init();
        this.photoPaletteModule.init();
        this.touchGestureModule.init();

        // Attacher les événements pour l'annulation et le rétablissement
        const undoBtn = document.getElementById('annuler-btn');
        const redoBtn = document.getElementById('rétablir-btn');

        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.historyModule.annuler());
        } else {
            console.warn("Le bouton 'Annuler' avec l'ID 'annuler-btn' est introuvable.");
        }

        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.historyModule.retablir());
        } else {
            console.warn("Le bouton 'Rétablir' avec l'ID 'rétablir-btn' est introuvable.");
        }

        // Gestion du bouton "Réinitialiser Vue"
        const resetViewBtn = document.getElementById('reset-view-btn');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => this.resetView());
        } else {
            console.warn("Le bouton 'Réinitialiser Vue' avec l'ID 'reset-view-btn' est introuvable.");
        }

        // Attacher un nouvel événement pour le bouton "Supprimer l'objet"
        const deleteObjectBtn = document.getElementById('delete-object');
        if (deleteObjectBtn) {
            deleteObjectBtn.addEventListener('click', () => {
                this.importExportModule.deleteSelectedObject();
            });
        } else {
            console.warn("Le bouton 'Supprimer l'objet' avec l'ID 'delete-object' est introuvable.");
        }

        // Enregistrer l'état initial
        this.historyModule.enregistrerEtat();
    }

    resetView() {
        // Réinitialiser le pan et le zoom du canevas
        this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        this.canvas.setZoom(1);
        this.canvas.requestRenderAll();
    }
}

// Initialisation de l'Application une fois le DOM chargé
document.addEventListener('DOMContentLoaded', () => {
    const drawingBoard = document.querySelector('.drawing-board');

    const canvas = new fabric.Canvas('canvas', {
        isDrawingMode: false,
        backgroundColor: 'white',
        allowTouchScrolling: true,
        width: drawingBoard.clientWidth,
        height: 297 * 3.7795275591 // Hauteur A4 en pixels
    });

    const historyModule = new HistoryModule(canvas);
    const pageModule = new PageModule(canvas, historyModule);
    pageModule.setupA4Canvas();

    window.addEventListener('resize', () => {
        const newWidth = drawingBoard.clientWidth;
        canvas.setWidth(newWidth);
        canvas.renderAll();
    });

    const app = new App(canvas);
    app.init();
});