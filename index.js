let express = require(`express`);
let app = express();
let port = 3004;

app.listen(port, function () {
    console.log(`http://localhost:${port}`);
})

// Раздача статики
app.use(express.static(`public`));


// Настройка POST-запроса — JSON
app.use(express.json());


// Настройка БД
let mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/input-app');

// Схемы
let usersSchema = new mongoose.Schema({
    username: String,
    email: String,
    department: String,
    isDark: Boolean,
    draft: {
        to: String,
        text: String
    }
});

let User = mongoose.model('users', usersSchema);



// Роуты API

// Профиль пользователя
app.get(`/user`, async function (req, res) {
    let id = req.query.id;
    let user = await User.findOne({_id: id});

    res.send(user);
});

// Изменение настройки
app.post(`/theme/save`, async function (req, res) {
    let isDark = req.body.isDark;
    let userId = req.body.userId;

    let user = await User.findOne({_id: userId});
    user.isDark = isDark;
    await user.save();

    res.send(user);
});


// Сохранение черновика письма
app.post(`/draft/save`, async function (req, res) {
    let from = req.body.from;
    let to = req.body.to;
    let text = req.body.text;


    let user = await User.findOne({email: from});
    user.draft = {text, to};
    await user.save();

    res.send(user);
});


// Поиск по контактам
app.get(`/users/search`, async function (req, res) {
    let username = req.query.username;

    let users = await User.find({
        username: { $regex: new RegExp(username, 'i') }
    }).limit(5);

    // ищем по почте, если по имени не нашли
    if (users.length == 0) {
        users = await User.find({
            email: { $regex: new RegExp(username, 'i') }
        }).limit(5);
    }

    res.send(users);
});


// Отправка черновика: твоё ДЗ
let messageSchema = new mongoose.Schema({
    to: String,
    from: String,
    text: String
}, {
    timestamps: true
});

let Message = mongoose.model('messages', messageSchema);

app.post(`/draft/send`, async function (req, res) {
    let to = req.body.to;
    let from = req.body.from;
    let text = req.body.text;

    let userTo = await User.findOne({email: to});
    let userFrom = await User.findOne({email: from});
    

    if (userTo && userFrom && text) {
        let message = await Message({
            to: to,
            from: from,
            text: text
        });
        await message.save();
        userFrom.draft = null;
        await userFrom.save();
        res.send(message);
    } else {
        res.send(400);
    }
});