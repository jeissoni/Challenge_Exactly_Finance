// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract ETHPool {

    //state variable

    uint256 public ultimaFechaRecompensa;
    uint256 public totalRecompensa;

    struct detalleUsuario{
        uint256 deposito;
        uint256 fechaDeposito;
    }

    mapping(address => detalleUsuario) public usuarios;

    mapping(address => bool) public usuariosEquipo;

    //event 
    event depositoGananciasEquipo(address _from, uint256 _valor, uint256 _fecha);
    event depositoEthUsuario(address _from, uint256 _valor, uint256 _fecha);
    event retirarGanancias(address _from, uint256 _valor, uint256 _fecha);


    //modifier
    modifier soloEquipo() { // Modificador
        require(usuariosEquipo[msg.sender] == true, "Funcion exclusiva del equipo");
        _;
    }

    modifier pasoUnaSemana(){
        require(block.timestamp >= (ultimaFechaRecompensa + 1 weeks ), "No ha pasado una semana!");
        _;
    }

    //constructor

    constructor(){
        totalRecompensa = 0;
        ultimaFechaRecompensa = 0;
        usuariosEquipo[msg.sender] = true;
    }

    //funtion

    function depositarGananciasEquipo() soloEquipo pasoUnaSemana public payable {
        uint _fechaAnterior =ultimaFechaRecompensa;
        uint _totalRecompensa = totalRecompensa;
        totalRecompensa = msg.value;
        ultimaFechaRecompensa = block.timestamp;
        emit depositoGananciasEquipo(msg.sender , _totalRecompensa, _fechaAnterior);
    }


    function depositarEthUsuario() public payable {
       
        uint _ethAnterior = 0;
        uint _fechaAnterior = 0;

        //Es la primera vez?
        if (usuarios[msg.sender].deposito == 0){     

            _ethAnterior = usuarios[msg.sender].deposito;
            _fechaAnterior = usuarios[msg.sender].fechaDeposito; 
            
            usuarios[msg.sender].deposito = _ethAnterior + msg.value;
            usuarios[msg.sender].fechaDeposito = block.timestamp;

        }else{

            usuarios[msg.sender].deposito = msg.value;
            usuarios[msg.sender].fechaDeposito = block.timestamp;
        }

        emit depositoEthUsuario(msg.sender, _ethAnterior, _fechaAnterior);
    }


    function retirarDepositoMasGanancias() public {
        require(totalRecompensa > 0, "No hay recompensas por entregar");
        require(usuarios[msg.sender].deposito > 0 , "EL usuarion no a depositado");
        require(usuarios[msg.sender].fechaDeposito > ultimaFechaRecompensa , "No deposito a tiempo para la recompensa actual");

        uint256 porcentajeGanancia = (usuarios[msg.sender].deposito * 100) / totalRecompensa;

        uint256 ganaciasMasDeposito = usuarios[msg.sender].deposito + (totalRecompensa * porcentajeGanancia);

        usuarios[msg.sender].deposito = 0;

        totalRecompensa = totalRecompensa - ganaciasMasDeposito;

        (bool success,) = payable(msg.sender).call{value: ganaciasMasDeposito} ("");

        require(success, "Transfer failed");

        emit retirarGanancias(msg.sender, ganaciasMasDeposito, block.timestamp);
    }

}