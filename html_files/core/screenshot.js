// function takeScreenshot(screenshotFileName) {
//     html2canvas(document.body).then(canvas => {
//         // Create an image
//         var image = canvas.toDataURL("image/png");

//         // Create a link to download the image with the specified file name
//         var link = document.createElement('a');
//         link.href = image;
//         link.download = screenshotFileName + '.png'; // Use the provided file name
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     });
// }

function takeScreenshot(screenshotFileName) {
    return new Promise((resolve, reject) => {
        html2canvas(document.body).then(canvas => {
            // Create an image
            var image = canvas.toDataURL("image/png");

            // Create a link to download the image with the specified file name
            var link = document.createElement('a');
            link.href = image;
            link.download = screenshotFileName + '.png'; // Use the provided file name
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Resolve with the screenshot link
            resolve(link.href);
        }).catch(error => {
            reject(error);
        });
    });
}