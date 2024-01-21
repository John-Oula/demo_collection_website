function takeScreenshot() {
    html2canvas(document.body).then(canvas => {
        // Create an image
        var image = canvas.toDataURL("image/png");

        // Create a link to download the image
        var link = document.createElement('a');
        link.href = image;
        link.download = 'screenshot.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}