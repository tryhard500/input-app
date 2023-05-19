
// Настраиваем axios всегда отправлять JSON
axios.defaults.headers.post['Content-Type'] = 'application/json';


// Элементы на странице
let appContainer = document.querySelector(`.app-container`); // контейнер
let userSelect = document.querySelector(`#user-select`);     // выбор пользователя
let themeCheckbox = document.querySelector(`#theme`);        // выбор темы

let searchInput = document.querySelector(`#search`);         // поле для поиска контактов
let contactsContainer = document.querySelector(`.contacts-container`); // контейнер для вывода найденных контактов

let toInput = document.querySelector(`#to`);                 // поле Кому
let textInput = document.querySelector(`#text`);             // поле Текст письма 
let draftForm = document.querySelector(`#draft-form`);       // форма с кнопкой Отправить

// данные выбранного пользователя
let USER;

// Загрузка начального пользователя
renderUser();

// Выбор пользователя
userSelect.addEventListener(`input`, async function () {
  renderUser();
})

// Изменение темы
themeCheckbox.addEventListener(`change`, async function () {
    if (themeCheckbox.checked) {
        appContainer.classList.add('theme-dark');
    } else {
        appContainer.classList.remove('theme-dark');
    }

    await axios.post('/theme/save',{
        userId: USER._id,
        isDark: themeCheckbox.checked
    });
});     

// Поиск по контактам
searchInput.addEventListener(`input`, async function () {
    let response = await axios.get('/users/search',{
        params: {
            username: searchInput.value
        }
    });
    let users = response.data;
    contactsContainer.innerHTML = ``;

    if (users.length == 0) {
        contactsContainer.innerHTML = `Ничего не найдено`;
    }

    for (let i = 0; i < users.length; i++){
        let user = users[i];
        contactsContainer.innerHTML += `
            <li class="list-group-item">${user.username} - ${user.email}</li>
        `;
    }
});

// Автосохранения черновика при изменении поля Кому
toInput.addEventListener(`change`, function () {
    axios.post('/draft/save',{
        from: USER.email,
        to: toInput.value,
        text: textInput.value
    });    
});


// Автосохранения черновика при изменении текста письма
textInput.addEventListener(`keydown`, function (evt) {
    if (evt.key == ` `) {
        axios.post('/draft/save',{
            from: USER.email,
            to: toInput.value,
            text: textInput.value
        });
    }
})


// Отправка черновика сообщения
draftForm.addEventListener(`submit`, async function (evt) {
    evt.preventDefault();
    let response = await axios.post('/draft/send',{
        from: USER.email,
        to: toInput.value,
        text: textInput.value
    });
    if (response.status == 200) {
        draftForm.reset();
    }
})

// Функция, которая рисует пользователя
async function renderUser() {
    let userId = userSelect.value;
    let response = await axios.get(`/user`, {params: {id: userId}});
    USER = response.data;

    // имя пользователя
    let usernameNode = document.querySelector(`.username-container`);
    usernameNode.innerHTML = USER.username;

    // 1. Тема пользователя
    if (USER.isDark) {
        appContainer.classList.add('theme-dark');
        themeCheckbox.checked = true;
    } else {
        appContainer.classList.remove('theme-dark');
        themeCheckbox.checked = false;
    }


    // 2. Черновик пользователя
    // Заполни черновик письма значениями из БД
    if (USER.draft) {
        toInput.value = USER.draft.to;
        textInput.value = USER.draft.text;
    }
    
    // 3. Посе отрисовки данных пользователя показываем приложение
    appContainer.classList.remove('loading');
}
