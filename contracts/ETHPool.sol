// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract ETHPool {

    //state variable

    uint256 private ultimaFechaRecompensa;
    uint private totalRecompensa;

    struct detalleUsuario{
        uint256 deposito;
        uint256 fechaDeposito;
    }

    mapping(address => detalleUsuario) public usuarios;

    mapping(address => bool) public usuariosEquipo;

    //event 
    event depositoGanancias(address _from, uint256 _valor, uint256 _fecha);

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
    }

    //funtion


    function depositarGanancias() soloEquipo pasoUnaSemana public payable {
        uint _fechaAnterior =ultimaFechaRecompensa;
        uint _totalRecompensa = totalRecompensa;
        totalRecompensa = msg.value;
        ultimaFechaRecompensa = block.timestamp;
        emit depositoGanancias(msg.sender , _totalRecompensa, _fechaAnterior);

    }

}