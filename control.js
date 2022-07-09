const playlistCallback = (resultJson) => {
    document.querySelector(".result").innerHTML = JSON.stringify(resultJson);
    document.querySelector("#servicesList").innerHTML = '';
    resultJson.forEach((playlist) => {
        document.querySelector("#servicesList").insertAdjacentHTML('beforeend', `<li><button type="button" class="btn btn-link playlistButton" data-playlist-index="${playlist.id.index}">${playlist.id.name}</button></li>`);
    });

    document.querySelectorAll('.playlistButton').forEach((button) => {
        button.addEventListener("click", function (event) {
            loadService(event);
        });
    });
};

const getIP = () => {
    return document.querySelector("#serverIP").value
}

const getPort = () => {
    return document.querySelector("#serverPort").value
}

// load values from storage
const saveConnection = () => {
    let server = [];

    let fields = document.querySelectorAll(
        "#serverIP, #serverPort"
    );
    fields.forEach(function (element) {
        server.push({
            field: element.id,
            text: element.value
        });
    });
    console.log(server);
    localStorage.setItem("serverData", JSON.stringify(server));
};

const makeConnection = async () => {
    response = await fetch(`http://${getIP()}:${getPort()}/version`);
    json = await response.json();
    document.querySelector(".result").innerHTML = JSON.stringify(json);
    saveConnection();
    getPlaylists();
}

const loadService = async (event) => {
    response = await fetch(`http://${getIP()}:${getPort()}/v1/playlist/${event.target.dataset.playlistIndex}`);
    json = await response.json();
    document.querySelector("#serviceName").innerHTML = json.id.name;
    document.querySelector("#itemsList").innerHTML = '';
    json.items.forEach((item) => {
        document.querySelector("#itemsList").insertAdjacentHTML('beforeend', `<li><button type="button" class="btn btn-link itemButton" data-playlist-index="${json.id.index}" data-item-index="${item.id.index}">${item.id.name}</button></li>`);
    });

    document.querySelectorAll('.itemButton').forEach((button) => {
        button.addEventListener("click", function (event) {
            loadItem(event);
            document.querySelectorAll('.itemButton').forEach((button) => {
                button.classList.remove('active');
            })
            event.target.classList.add('active');
        });
    });

    document.querySelector("#serviceView").classList.remove('d-none');

    window.scrollTo(0, document.querySelector('#serviceName').getBoundingClientRect().top, 'smooth');
}

const loadItem = async (event) => {
    let response = await fetch(`http://${getIP()}:${getPort()}/v1/trigger/playlist/${event.target.dataset.playlistIndex}/${event.target.dataset.itemIndex}/0`);
    let status = await response.status;
    if (event.target.parentElement.parentElement.querySelectorAll('button').length <= parseInt(event.target.dataset.itemIndex, 10) + 1) {
        document.querySelector('#nextPlaylist').classList.add('d-none');
    } else {
        document.querySelector('#nextPlaylist').classList.remove('d-none');
    }
    document.querySelector(".result").innerHTML = JSON.stringify(status);
    setTimeout(loadSlideIndexInfo, 500);
}

const loadSlideIndexInfo = async () => {
    console.log('loadSlideIndexInfo');
    let response = await fetch(`http://${getIP()}:${getPort()}/v1/presentation/current`);
    let json = await response.json();
    document.querySelector(".result").innerHTML = JSON.stringify(json);
    loadSlideImages(json);
}

const getSlideImage = async (myImage, presentationUuid, index) => {
    console.log('getSlideImage');
    let response = await fetch(`http://${getIP()}:${getPort()}/v1/presentation/${presentationUuid}/thumbnail/${index}?quality=400`);
    let blob = await response.blob();
    var objectURL = URL.createObjectURL(blob);
    myImage.src = objectURL;
}

const goToNext = async (event) => {
    console.log('event');
    const result = await fetch(`http://${getIP()}:${getPort()}/v1/trigger/cue/${event.target.dataset.index}`);
}

const generateSlides = async (resultJson, index, slideGroup) => {
    document.querySelector("#slideList").insertAdjacentHTML('beforeend', `<div class="col-12 col-sm-4 mb-4 pt-md-2 position-relative slide"><img data-index="${index}" data-uuid="${resultJson.presentation.id.uuid}" class="slideImage" /><button type="button" class="btn btn-primary refreshSlide"><i class="bi bi-arrow-clockwise"></i></button><span class="initialism groupType">${slideGroup}</span></div>`);

    var myImage = document.querySelectorAll('.slideImage')[index];
    
    if (index === 0) {
        myImage.classList.add('active');
    }

    myImage.addEventListener('click', function(event) {
        goToNext(event);
        const allSlides = document.querySelectorAll('.slideImage');
        allSlides.forEach((slide) => {
            slide.classList.remove('active');
        });
        event.target.classList.add('active');
    });
    console.log(resultJson);
    await getSlideImage(myImage, resultJson.presentation.id.uuid, index);
}

const loadSlideImages = async (resultJson) => {
    console.log('loadSlideImages');
    const playlistObj = {};
    let playlistLength = 0;
    resultJson.presentation.groups.forEach((group) => {
        group.slides.forEach((slide, index) => {
            if (index === 0) {
                playlistObj[playlistLength] = group.name;
            } else {
                playlistObj[playlistLength] = '';
            }
            playlistLength = playlistLength + 1;
        });
    });

    document.querySelector("#ItemName").innerHTML = resultJson.presentation.id.name;
    document.querySelector("#slideList").innerHTML = '';

    for(i=0; i<Object.keys(playlistObj).length; i++) {
        generateSlides(resultJson, i, playlistObj[i]);
    }
    if (window.innerWidth < 576) {
        window.scrollTo(0, document.querySelector('#ItemName').getBoundingClientRect().top + 460, 'smooth');
    }
}

const loadNextPlaylist = async () => {
    document.querySelector('.active.itemButton').parentElement.nextSibling.querySelector('button').click();
    // window.scrollTo(0, document.querySelector('#ItemName').getBoundingClientRect().top + 460, 'smooth');
}

const getPlaylists = async () => {
    if (getIP() != '') {
        let response = await fetch(`http://${getIP()}:${getPort()}/v1/playlists`);
        let json = await response.json();
        playlistCallback(json);
    }
}

const refreshImage = async (myImage, uuid, index) => {
    await getSlideImage(myImage, uuid, index);
}

document.querySelector(".saveButton").addEventListener("click", saveConnection);
document.querySelector(".connectButton").addEventListener("click", makeConnection);
document.querySelector("#nextPlaylist").addEventListener("click", loadNextPlaylist);
document.querySelector("#previousSlide").addEventListener("click", function() {
    fetch(`http://${getIP()}:${getPort()}/v1/trigger/previous`);
    const previousSlide = document.querySelector('.slideImage.active').parentElement.previousSibling;
    if (previousSlide) {
        document.querySelectorAll('.slideImage').forEach((slide) => {
            slide.classList.remove('active');
        });
        previousSlide.querySelector('img').classList.add('active');
    }
});
document.querySelector("#nextSlide").addEventListener("click", function() {
    fetch(`http://${getIP()}:${getPort()}/v1/trigger/next`);
    const nextSlide = document.querySelector('.slideImage.active').parentElement.nextSibling;
    if (nextSlide) {
        document.querySelectorAll('.slideImage').forEach((slide) => {
            slide.classList.remove('active');
        });
        nextSlide.querySelector('img').classList.add('active');
    }
});
document.addEventListener("click", function(event) {
    if (event.target.classList.contains("refreshSlide") || event.target.classList.contains("bi-arrow-clockwise")) {
        const slideImgElement = event.target.closest('.slide').querySelector('img');
        refreshImage(slideImgElement, slideImgElement.dataset.uuid, slideImgElement.dataset.index);
        event.preventDefault();
        event.stopPropagation();
    }
});

// on page load, load saved values if they exist
let stored = JSON.parse(localStorage.getItem("serverData"));
if (stored) {
    console.log(stored);
    stored.forEach(function (item) {
        document
            .querySelector("#" + item.field).value = item.text;
    });
}

getPlaylists();