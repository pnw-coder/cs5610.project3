import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import './PasswordPage.css';

function PasswordPage() {
    const navigate = useNavigate();

    const [passwordListState, setPasswordListState] = useState([]);
    const [websiteNameState, setWebsiteNameState] = useState('');
    const [passwordBodyState, setPasswordBodyState] = useState('');
    const [alphabetCheckbox, setAlphabetCheckbox] = useState(false);
    const [numeralsCheckbox, setNumeralsCheckbox] = useState(false);
    const [symbolsCheckbox, setSymbolsCheckbox] = useState(false);
    const [passwordLength, setPasswordLength] = useState(12);
    const [editingState, setEditingState] = useState({
        isEditing: false,
        editingPasswordId: '',
    });
    const [errorMsgState, setErrorMsgState] = useState('');
    const [username, setUsername] = useState('');

    async function getAllPasswords() {
        const response = await axios.get('/api/password');
        setPasswordListState(response.data);
    }

    async function deletePassword(passwordId) {
        await axios.delete('/api/password/' + passwordId);
        await getAllPasswords();
    }

    async function onSubmit() {
        setErrorMsgState('')
        try {
            if (!websiteNameState) {
                throw new Error('Please enter a website name');
            }

            let passwordToSubmit = passwordBodyState;

            // If in editing mode, update the existing password
            if (editingState.isEditing) {
                const existingPassword = passwordListState.find(password => password._id === editingState.editingPasswordId);
                if (!existingPassword) {
                    throw new Error('Password not found.');
                }

                if (existingPassword.user !== username) {
                    throw new Error('You do not own this password.');
                }
                // Update the password
                await axios.put('/api/password/' + editingState.editingPasswordId, {
                    website: websiteNameState,
                    body: passwordToSubmit,
                });
            } else {
                // If a password is not provided, generate one
                if (!passwordToSubmit) {
                    if (!(alphabetCheckbox || numeralsCheckbox || symbolsCheckbox)) {
                        throw new Error('Please select at least one option.');
                    }
                    if (passwordLength < 4 || passwordLength > 50) {
                        throw new Error('Password length must be between 4 and 50 characters.');
                    }
                    passwordToSubmit = generatePassword();
                }
            }

            await axios.post('/api/password', {
                website: websiteNameState,
                body: passwordToSubmit,
            });

            setWebsiteNameState('');
            setPasswordBodyState('');
            setEditingState({
                isEditing: false,
                editingPasswordId: '',
            });
            await getAllPasswords();
        } catch (error) {
            setErrorMsgState(error.message);
        }
    }

    function generatePassword() {
        let password = '';
        const characters = [];
        if (alphabetCheckbox) characters.push('abcdefghijklmnopqrstuvwxyz');
        if (numeralsCheckbox) characters.push('0123456789');
        if (symbolsCheckbox) characters.push('!@#$%^&*()-_=+[{]}|;:,<.>/?');

        for (let i = 0; i < passwordLength; i++) {
            const characterSet = characters[Math.floor(Math.random() * characters.length)];
            password += characterSet.charAt(Math.floor(Math.random() * characterSet.length));
        }

        return password;
    }

    function updatePasswordWebsite(event) {
        setWebsiteNameState(event.target.value);
    }

    function updatePasswordBody(event) {
        setPasswordBodyState(event.target.value);
    }

    function setEditingPassword(websiteName, passwordBody, passwordId) {
        setWebsiteNameState(websiteName);
        setPasswordBodyState(passwordBody);
        setEditingState({
            isEditing: true,
            editingPasswordId: passwordId
        });
    }

    function onStart() {
        isLoggedIn()
            .then(() => {
                getAllPasswords()
            })
    }

    function onCancel() {
        setWebsiteNameState('');
        setPasswordBodyState('');
        setEditingState({
            isEditing: false,
            editingPasswordId: '',
        });
    }

    async function logout() {
        await axios.post('/api/users/logout');
        navigate('/');
    }

    async function isLoggedIn() {
        try {
            const response = await axios.get('/api/users/loggedIn');
            const username = response.data.username;
            setUsername(username);
        } catch (e) {
            navigate('/')
        }
    }

    useEffect(onStart, []);

    const passwordListElement = [];
    for (let i = 0; i < passwordListState.length; i++) {
        passwordListElement.push(<li className='password-item'>Website: {passwordListState[i].website}
            - Password: {passwordListState[i].body}
            - <button onClick={() => deletePassword(passwordListState[i]._id)}>Delete</button>
            - <button onClick={() => setEditingPassword(passwordListState[i].website, passwordListState[i].body, passwordListState[i]._id)}>Edit</button>
        </li>)
    }

    const inputFieldTitleText = editingState.isEditing ? "Edit Password" : "Add new password";

    if (!username) {
        return <div>Loading...</div>
    }
    //--------
    // const [sharedUsername, setSharedUsername] = useState('');
    // const [sharedPasswords, setSharedPasswords] = useState([]);
    // const [sharingStatus, setSharingStatus] = useState('');
    // async function sharePasswords() {
    //     try {
    //         if (sharedUsername === username) {
    //             throw new Error('You cannot share passwords with yourself.');
    //         }
    //         const response = await axios.post('/api/password/share', {
    //             sharedUsername: sharedUsername
    //         });

    //         setSharedPasswords(response.data);
    //         setSharedUsername('');
    //         setSharingStatus(`Password shared with ${sharedUsername}`);
    //     } catch (error) {
    //         setSharingStatus(error.message);
    //     }
    // }
    //--------
    return (
        <div className='password-manager-container'>
            <div>
                <button onClick={logout}>Logout</button>

            </div>
            {errorMsgState && <h1>
                {errorMsgState}
            </h1>}
            Here are all your passwords, {username}!
            <ul>
                {passwordListElement}
            </ul>

            <div>{inputFieldTitleText}</div>
            <div>
                <div>
                    <label>Website:</label> <input value={websiteNameState} onInput={(event) => updatePasswordWebsite(event)} />
                </div>
                <div>
                    <label>Password:</label> <input value={passwordBodyState} onInput={(event) => updatePasswordBody(event)} />
                </div>
                <div>
                    <div>
                        <input
                            type="number"
                            min="4"
                            max="50"
                            value={passwordLength}
                            onChange={(event) => setPasswordLength(parseInt(event.target.value))}
                        />
                        <label>Password Length (4-50):</label>
                    </div>
                </div>
                <div>
                    <div>
                        <input type="checkbox" checked={alphabetCheckbox} onChange={() => setAlphabetCheckbox(!alphabetCheckbox)} />
                        <label>Include Alphabet</label>
                    </div>
                    <div>
                        <input type="checkbox" checked={numeralsCheckbox} onChange={() => setNumeralsCheckbox(!numeralsCheckbox)} />
                        <label>Include Numerals</label>
                    </div>
                    <div>
                        <input type="checkbox" checked={symbolsCheckbox} onChange={() => setSymbolsCheckbox(!symbolsCheckbox)} />
                        <label>Include Symbols</label>
                    </div>
                </div>
                <div>
                    <button onClick={() => onSubmit()}>Submit</button>
                    <button onClick={() => onCancel()}>Cancel</button>
                </div>
            </div>

            {/* <div>
                <div>
                    <label>Enter Username to Share Passwords:</label>
                    <input value={sharedUsername} onChange={(event) => setSharedUsername(event.target.value)} />
                </div>
                <button onClick={() => sharePasswords()}>Submit</button>
                {sharingStatus && <div>{sharingStatus}</div>}
            </div>

            {sharedPasswords.length > 0 && (
                <div>
                    <h3>Shared Passwords:</h3>
                    <ul>
                        {sharedPasswords.map((password) => (
                            <li key={password._id}>
                                <span>{password.username}'s Password:</span>
                                <span>{password.body}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )} */}
        </div>
    )
}



export default PasswordPage;